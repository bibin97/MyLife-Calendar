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

describe('Local MongoDB — Categories & Activities Integration Tests', () => {
  let app;
  let userA, userB;
  let cookieA, cookieB;
  let defaultCategory;

  beforeAll(async () => {
    await connectDB();
    await seedDefaultCategories();
    app = createApp();

    // Create 2 test users for data isolation testing
    await User.deleteMany({ phoneNumber: { $in: ['+919999900001', '+919999900002'] } });

    userA = await User.create({
      phoneNumber: '+919999900001',
      displayName: 'User A',
      preferredLanguage: 'en',
      timezone: 'Asia/Kolkata'
    });

    userB = await User.create({
      phoneNumber: '+919999900002',
      displayName: 'User B',
      preferredLanguage: 'ml',
      timezone: 'Asia/Kolkata'
    });

    // Generate cookies
    const tokenA = jwt.sign({ userId: userA._id, phoneNumber: userA.phoneNumber }, env.JWT_SECRET);
    cookieA = `token=${tokenA}`;

    const tokenB = jwt.sign({ userId: userB._id, phoneNumber: userB.phoneNumber }, env.JWT_SECRET);
    cookieB = `token=${tokenB}`;

    defaultCategory = await Category.findOne({ key: 'went_to_church', isDefault: true });
    expect(defaultCategory).toBeDefined();

    // Clean test activities
    await Activity.deleteMany({ userId: { $in: [userA._id, userB._id] } });
  });

  afterAll(async () => {
    // Clean up test data
    await Activity.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await Category.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await disconnectDB();
  });

  describe('1. Category APIs & Protection of Defaults', () => {
    let customCatId;

    it('GET /api/categories returns 26 default categories with English & Malayalam names', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      expect(res.body.categories).toBeDefined();
      expect(res.body.categories.length).toBeGreaterThanOrEqual(26);

      const churchCat = res.body.categories.find((c) => c.key === 'went_to_church');
      expect(churchCat).toBeDefined();
      expect(churchCat.nameEn).toBe('Went to Church');
      expect(churchCat.nameMl).toBe('പള്ളിയിൽ പോയി');
      expect(churchCat.isDefault).toBe(true);
    });

    it('POST /api/categories creates a custom user category', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Cookie', cookieA);

      const createRes = await request(app)
        .post('/api/categories')
        .set('Cookie', cookieA)
        .send({
          nameEn: 'Gardening Work',
          nameMl: 'തോട്ടപ്പണി ചെയ്തു'
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.category.nameEn).toBe('Gardening Work');
      expect(createRes.body.category.nameMl).toBe('തോട്ടപ്പണി ചെയ്തു');
      expect(createRes.body.category.isDefault).toBe(false);
      expect(createRes.body.category.userId).toBe(userA._id.toString());
      customCatId = createRes.body.category._id;
    });

    it('PATCH /api/categories/:id prevents modifying default system categories', async () => {
      const res = await request(app)
        .patch(`/api/categories/${defaultCategory._id}`)
        .set('Cookie', cookieA)
        .send({ nameEn: 'Hacked Church' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Default system categories cannot be modified');
    });

    it('DELETE /api/categories/:id prevents deleting default system categories', async () => {
      const res = await request(app)
        .delete(`/api/categories/${defaultCategory._id}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Default system categories cannot be deleted');
    });

    it('PATCH /api/categories/:id allows editing user custom category', async () => {
      const res = await request(app)
        .patch(`/api/categories/${customCatId}`)
        .set('Cookie', cookieA)
        .send({ nameEn: 'Organic Gardening' });

      expect(res.status).toBe(200);
      expect(res.body.category.nameEn).toBe('Organic Gardening');
    });

    it('DELETE /api/categories/:id allows deleting user custom category', async () => {
      const res = await request(app)
        .delete(`/api/categories/${customCatId}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
    });
  });

  describe('2. Activity APIs, Future Date Restriction & Unicode Notes', () => {
    const today = getTodayKeyInTimezone('Asia/Kolkata');
    let activity1Id, activity2Id;

    it('POST /api/activities strictly rejects future dates', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const futureKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      const res = await request(app)
        .post('/api/activities')
        .set('Cookie', cookieA)
        .send({
          selectedDate: futureKey,
          categoryId: defaultCategory._id.toString(),
          notes: 'Cannot record future activity',
          crossColor: '#ef4444',
          noteColor: '#2563eb'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Future dates are strictly restricted');
    });

    it('POST /api/activities saves activity with Malayalam notes and server UTC timestamp', async () => {
      const malayalamNote = 'ഇന്ന് കുടുംബത്തിനുവേണ്ടി പ്രത്യേക നിയോഗം കാഴ്ചവച്ചു. ദൈവത്തിന് നന്ദി.';

      const res = await request(app)
        .post('/api/activities')
        .set('Cookie', cookieA)
        .send({
          selectedDate: today,
          categoryId: defaultCategory._id.toString(),
          notes: malayalamNote,
          crossColor: '#dc2626',
          noteColor: '#1d4ed8'
        });

      expect(res.status).toBe(201);
      expect(res.body.activity).toBeDefined();
      expect(res.body.activity.notes).toBe(malayalamNote);
      expect(res.body.activity.categoryNameSnapshot.en).toBe('Went to Church');
      expect(res.body.activity.categoryNameSnapshot.ml).toBe('പള്ളിയിൽ പോയി');
      expect(res.body.activity.createdAt).toBeDefined();
      activity1Id = res.body.activity._id;
    });

    it('allows multiple activities on the same date with different categories & colors', async () => {
      const bibleCat = await Category.findOne({ key: 'read_the_bible' });

      const res = await request(app)
        .post('/api/activities')
        .set('Cookie', cookieA)
        .send({
          selectedDate: today,
          categoryId: bibleCat._id.toString(),
          notes: 'Read Psalm 23 / സങ്കീർത്തനം 23 വായിച്ചു',
          crossColor: '#16a34a', // Green cross
          noteColor: '#059669'
        });

      expect(res.status).toBe(201);
      activity2Id = res.body.activity._id;

      // Check date activities list
      const listRes = await request(app)
        .get(`/api/activities?date=${today}`)
        .set('Cookie', cookieA);

      expect(listRes.status).toBe(200);
      expect(listRes.body.activities.length).toBe(2);
      // Newest activity first
      expect(listRes.body.activities[0]._id).toBe(activity2Id);
    });

    it('GET /api/activities?month=YYYY-MM returns ONE single cross mark with latest color', async () => {
      const currentMonth = today.slice(0, 7); // YYYY-MM

      const res = await request(app)
        .get(`/api/activities?month=${currentMonth}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      expect(res.body.marks).toBeDefined();
      expect(res.body.marks[today]).toBeDefined();

      // Exactly ONE cross mark with the latest activity's color (#16a34a)
      expect(res.body.marks[today].isMarked).toBe(true);
      expect(res.body.marks[today].color).toBe('#16a34a');
      expect(res.body.marks[today].activityCount).toBe(2);
    });

    it('PATCH /api/activities/:id preserves original createdAt and updates notes', async () => {
      const originalDoc = await Activity.findById(activity1Id);
      const originalCreatedAt = originalDoc.createdAt.toISOString();

      const updatedNote = 'Updated note: വിശുദ്ധ കുർബാന കഴിഞ്ഞ് പ്രാർത്ഥിച്ചു.';

      const res = await request(app)
        .patch(`/api/activities/${activity1Id}`)
        .set('Cookie', cookieA)
        .send({
          notes: updatedNote,
          crossColor: '#9333ea'
        });

      expect(res.status).toBe(200);
      expect(res.body.activity.notes).toBe(updatedNote);
      expect(res.body.activity.crossColor).toBe('#9333ea');
      // CreatedAt MUST remain unchanged
      expect(new Date(res.body.activity.createdAt).toISOString()).toBe(originalCreatedAt);
    });

    it('enforces User Data Isolation: User B cannot access or modify User A activities', async () => {
      // User B tries to edit User A's activity
      const patchRes = await request(app)
        .patch(`/api/activities/${activity1Id}`)
        .set('Cookie', cookieB)
        .send({ notes: 'Malicious overwrite' });

      expect(patchRes.status).toBe(403);

      // User B tries to delete User A's activity
      const delRes = await request(app)
        .delete(`/api/activities/${activity1Id}`)
        .set('Cookie', cookieB);

      expect(delRes.status).toBe(403);

      // User B cannot see User A's activities in date query
      const listRes = await request(app)
        .get(`/api/activities?date=${today}`)
        .set('Cookie', cookieB);

      expect(listRes.status).toBe(200);
      expect(listRes.body.activities.length).toBe(0);
    });

    it('DELETE /api/activities/:id deletes only the targeted activity and recalculates remaining cross', async () => {
      const res = await request(app)
        .delete(`/api/activities/${activity2Id}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      expect(res.body.remainingCount).toBe(1);
      // Activity 1 cross color is now the latest
      expect(res.body.newLatestCrossColor).toBe('#9333ea');

      // Delete the last remaining activity
      const lastRes = await request(app)
        .delete(`/api/activities/${activity1Id}`)
        .set('Cookie', cookieA);

      expect(lastRes.status).toBe(200);
      expect(lastRes.body.remainingCount).toBe(0);
      expect(lastRes.body.newLatestCrossColor).toBeNull();
    });
  });
});
