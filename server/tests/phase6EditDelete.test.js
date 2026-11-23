/**
 * Phase 6 — Edit & Delete Activity Integration Tests
 *
 * Tests:
 *  1. Edit activity → createdAt unchanged, updatedAt updated
 *  2. Create 2 activities on same date → delete one → 1 remains + cross colour correct
 *  3. Delete last activity → remainingCount=0, newLatestCrossColor=null
 *  4. User isolation: User B cannot edit/delete User A's activities
 *  5. GET /api/activities?date=YYYY-MM-DD returns newest first
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDefaultCategories } from '../src/services/seedService.js';
import { User } from '../src/models/User.js';
import { Category } from '../src/models/Category.js';
import { Activity } from '../src/models/Activity.js';
import { env } from '../src/config/env.js';
import { getTodayKeyInTimezone } from '../src/utils/dateValidator.js';

describe('Phase 6 — Edit & Delete Activity API Tests', () => {
  let app;
  let userA, userB;
  let cookieA, cookieB;
  let defaultCat;
  const TODAY = getTodayKeyInTimezone('Asia/Kolkata');

  beforeAll(async () => {
    await connectDB();
    await seedDefaultCategories();
    app = createApp();

    // Clean up any leftover test users
    await User.deleteMany({ phoneNumber: { $in: ['+919988776601', '+919988776602'] } });

    userA = await User.create({
      phoneNumber: '+919988776601',
      displayName: 'Phase6 User A',
      preferredLanguage: 'en',
      timezone: 'Asia/Kolkata',
    });

    userB = await User.create({
      phoneNumber: '+919988776602',
      displayName: 'Phase6 User B',
      preferredLanguage: 'ml',
      timezone: 'Asia/Kolkata',
    });

    const tokenA = jwt.sign({ userId: userA._id, phoneNumber: userA.phoneNumber }, env.JWT_SECRET);
    cookieA = `token=${tokenA}`;

    const tokenB = jwt.sign({ userId: userB._id, phoneNumber: userB.phoneNumber }, env.JWT_SECRET);
    cookieB = `token=${tokenB}`;

    defaultCat = await Category.findOne({ key: 'went_to_church', isDefault: true });
    expect(defaultCat).toBeDefined();

    // Start with clean activities for test users
    await Activity.deleteMany({ userId: { $in: [userA._id, userB._id] } });
  });

  afterAll(async () => {
    await Activity.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await disconnectDB();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Edit activity — createdAt preserved, updatedAt changes
  // ─────────────────────────────────────────────────────────────────────────
  describe('1. Edit Activity (PATCH /api/activities/:id)', () => {
    let activityId;
    let originalCreatedAt;

    it('Creates an activity for edit test', async () => {
      const res = await request(app)
        .post('/api/activities')
        .set('Cookie', cookieA)
        .send({
          selectedDate: TODAY,
          categoryId: defaultCat._id,
          notes: 'Original notes — ആദ്യ കുറിപ്പ്',
          crossColor: '#dc2626',
          noteColor: '#1e3a8a',
        });

      expect(res.status).toBe(201);
      expect(res.body.activity).toBeDefined();
      activityId = res.body.activity._id;
      originalCreatedAt = res.body.activity.createdAt;
    });

    it('PATCH updates the activity — category, notes, colors', async () => {
      const res = await request(app)
        .patch(`/api/activities/${activityId}`)
        .set('Cookie', cookieA)
        .send({
          notes: 'Updated notes — അപ്ഡേറ്റ് ചെയ്ത കുറിപ്പ്',
          crossColor: '#7c3aed',
          noteColor: '#064e3b',
        });

      expect(res.status).toBe(200);
      expect(res.body.activity).toBeDefined();
      expect(res.body.activity.notes).toBe('Updated notes — അപ്ഡേറ്റ് ചെയ്ത കുറിപ്പ്');
      expect(res.body.activity.crossColor).toBe('#7c3aed');
    });

    it('createdAt is preserved after edit — backend must NOT overwrite it', async () => {
      const res = await request(app)
        .patch(`/api/activities/${activityId}`)
        .set('Cookie', cookieA)
        .send({ notes: 'Second update — Malayalam preserved: ഇത് ശരിയാണ്' });

      expect(res.status).toBe(200);
      // createdAt must match original
      expect(res.body.activity.createdAt).toBe(originalCreatedAt);
    });

    it('updatedAt changes after each edit', async () => {
      // Fetch current updatedAt
      const getRes = await request(app)
        .get(`/api/activities?date=${TODAY}`)
        .set('Cookie', cookieA);

      expect(getRes.status).toBe(200);
      const found = getRes.body.activities.find((a) => a._id === activityId);
      expect(found).toBeDefined();
      expect(found.updatedAt).toBeDefined();
      // updatedAt must differ from createdAt since we edited it
      expect(found.updatedAt).not.toBe(originalCreatedAt);
    });

    it('selectedDate field is ignored/stripped on PATCH (date cannot be changed)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureDateStr = futureDate.toISOString().slice(0, 10);

      // updateActivitySchema strips unknown fields — selectedDate is stripped safely
      const res = await request(app)
        .patch(`/api/activities/${activityId}`)
        .set('Cookie', cookieA)
        .send({ selectedDate: futureDateStr, notes: 'Still updating notes safely' });

      // Should succeed but selectedDate is ignored (stripped by Zod)
      expect(res.status).toBe(200);
      expect(res.body.activity.selectedDate).toBe(TODAY); // unchanged
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2 & 3: Delete — single, then last activity
  // ─────────────────────────────────────────────────────────────────────────
  describe('2. Delete Activity (DELETE /api/activities/:id)', () => {
    let act1Id, act2Id;
    const RED = '#dc2626';
    const BLUE = '#1d4ed8';

    beforeAll(async () => {
      // Create 2 activities on the same date in sequence
      // act1 is older, act2 is newer (newest = act2 → its color drives the cross)
      await Activity.deleteMany({ userId: userA._id, selectedDate: TODAY });

      const r1 = await request(app)
        .post('/api/activities')
        .set('Cookie', cookieA)
        .send({
          selectedDate: TODAY,
          categoryId: defaultCat._id,
          notes: 'Activity 1',
          crossColor: RED,
          noteColor: '#1c1917',
        });
      act1Id = r1.body.activity._id;

      // Small delay so createdAt differs
      await new Promise((r) => setTimeout(r, 50));

      const r2 = await request(app)
        .post('/api/activities')
        .set('Cookie', cookieA)
        .send({
          selectedDate: TODAY,
          categoryId: defaultCat._id,
          notes: 'Activity 2 — newest',
          crossColor: BLUE,
          noteColor: '#1c1917',
        });
      act2Id = r2.body.activity._id;
    });

    it('Two activities exist on the same date', async () => {
      const res = await request(app)
        .get(`/api/activities?date=${TODAY}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      // Filter to only the two we just made
      const ours = res.body.activities.filter((a) => [act1Id, act2Id].includes(a._id));
      expect(ours.length).toBe(2);
    });

    it('Delete the NEWER activity (act2) → 1 remains, cross colour = act1 colour', async () => {
      const res = await request(app)
        .delete(`/api/activities/${act2Id}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      expect(res.body.remainingCount).toBe(1);
      expect(res.body.newLatestCrossColor).toBe(RED);  // act1 is now latest remaining
    });

    it('Month marks show 1 activity with act1 cross colour after partial delete', async () => {
      const monthStr = TODAY.slice(0, 7);
      const res = await request(app)
        .get(`/api/activities?month=${monthStr}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const mark = res.body.marks?.[TODAY];
      expect(mark).toBeDefined();
      expect(mark.isMarked).toBe(true);
      expect(mark.activityCount).toBeGreaterThanOrEqual(1);
      // Cross colour should now be act1's colour (RED)
      expect(mark.color).toBe(RED);
    });

    it('Delete the LAST remaining activity → remainingCount=0, newLatestCrossColor=null', async () => {
      const res = await request(app)
        .delete(`/api/activities/${act1Id}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      expect(res.body.remainingCount).toBe(0);
      expect(res.body.newLatestCrossColor).toBeNull();
    });

    it('Month marks show no cross for the date after all activities deleted', async () => {
      const monthStr = TODAY.slice(0, 7);
      const res = await request(app)
        .get(`/api/activities?month=${monthStr}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const mark = res.body.marks?.[TODAY];
      // Either no mark entry or isMarked=false
      expect(!mark || !mark.isMarked).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: User Isolation — User B cannot edit/delete User A's activities
  // ─────────────────────────────────────────────────────────────────────────
  describe('3. User Isolation — ownership enforcement', () => {
    let userAActivityId;

    beforeAll(async () => {
      // Create activity under User A
      const res = await request(app)
        .post('/api/activities')
        .set('Cookie', cookieA)
        .send({
          selectedDate: TODAY,
          categoryId: defaultCat._id,
          notes: 'User A private data',
          crossColor: '#0f766e',
          noteColor: '#1c1917',
        });
      userAActivityId = res.body.activity._id;
    });

    it('User B cannot PATCH User A\'s activity (403)', async () => {
      const res = await request(app)
        .patch(`/api/activities/${userAActivityId}`)
        .set('Cookie', cookieB)
        .send({ notes: 'Attempted hack by User B' });

      expect(res.status).toBe(403);
    });

    it('User B cannot DELETE User A\'s activity (403)', async () => {
      const res = await request(app)
        .delete(`/api/activities/${userAActivityId}`)
        .set('Cookie', cookieB);

      expect(res.status).toBe(403);
    });

    it('User B cannot VIEW User A\'s activity in date query', async () => {
      const res = await request(app)
        .get(`/api/activities?date=${TODAY}`)
        .set('Cookie', cookieB);

      expect(res.status).toBe(200);
      const ids = res.body.activities.map((a) => a._id);
      expect(ids).not.toContain(userAActivityId);
    });

    it('User A\'s activity is NOT modified after User B\'s failed attempt', async () => {
      const res = await request(app)
        .get(`/api/activities?date=${TODAY}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const act = res.body.activities.find((a) => a._id === userAActivityId);
      expect(act).toBeDefined();
      expect(act.notes).toBe('User A private data');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: GET /api/activities?date returns newest-first ordering
  // ─────────────────────────────────────────────────────────────────────────
  describe('4. Date Activities — newest first ordering', () => {
    beforeAll(async () => {
      // Add two more with small time gap so createdAt ordering is deterministic
      await request(app)
        .post('/api/activities')
        .set('Cookie', cookieA)
        .send({
          selectedDate: TODAY,
          categoryId: defaultCat._id,
          notes: 'Older activity',
          crossColor: '#fbbf24',
          noteColor: '#1c1917',
        });

      await new Promise((r) => setTimeout(r, 60));

      await request(app)
        .post('/api/activities')
        .set('Cookie', cookieA)
        .send({
          selectedDate: TODAY,
          categoryId: defaultCat._id,
          notes: 'Newest activity',
          crossColor: '#06b6d4',
          noteColor: '#1c1917',
        });
    });

    it('Activities returned with newest createdAt first', async () => {
      const res = await request(app)
        .get(`/api/activities?date=${TODAY}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const acts = res.body.activities;
      expect(acts.length).toBeGreaterThanOrEqual(2);

      // Verify descending order
      for (let i = 0; i < acts.length - 1; i++) {
        const t1 = new Date(acts[i].createdAt).getTime();
        const t2 = new Date(acts[i + 1].createdAt).getTime();
        expect(t1).toBeGreaterThanOrEqual(t2);
      }
    });
  });
});
