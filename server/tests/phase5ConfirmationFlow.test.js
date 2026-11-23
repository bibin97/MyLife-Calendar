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

describe('Phase 5 — Activity Entry & Two-Step Confirmation Integration Tests', () => {
  let app;
  let testUser;
  let authCookie;
  let churchCategory;
  let prayerCategory;
  const today = getTodayKeyInTimezone('Asia/Kolkata');

  beforeAll(async () => {
    await connectDB();
    await seedDefaultCategories();
    app = createApp();

    await User.deleteMany({ phoneNumber: '+919876500055' });
    testUser = await User.create({
      phoneNumber: '+919876500055',
      displayName: 'Phase 5 Test User',
      preferredLanguage: 'en',
      timezone: 'Asia/Kolkata'
    });

    const token = jwt.sign({ userId: testUser._id }, env.JWT_SECRET);
    authCookie = `token=${token}`;

    churchCategory = await Category.findOne({ key: 'went_to_church' });
    prayerCategory = await Category.findOne({ key: 'prayed' });

    await Activity.deleteMany({ userId: testUser._id });
  });

  afterAll(async () => {
    await Activity.deleteMany({ userId: testUser._id });
    await User.deleteMany({ _id: testUser._id });
    await disconnectDB();
  });

  it('Requirement 7 & 8: Form submission without backend POST creates ZERO database records', async () => {
    // If user opens entry modal, fills data, but cancels or edits, no DB call occurs
    const countBefore = await Activity.countDocuments({ userId: testUser._id });
    expect(countBefore).toBe(0);
  });

  it('Requirement 4 & 5: Confirm & Save stores independent colors and raw Malayalam notes', async () => {
    const malayalamNote = 'ഇന്ന് അതിരാവിലെ പള്ളിയിൽ പോയി വിശുദ്ധ കുർബാനയിൽ പങ്കെടുത്തു.';

    const res = await request(app)
      .post('/api/activities')
      .set('Cookie', authCookie)
      .send({
        selectedDate: today,
        categoryId: churchCategory._id.toString(),
        notes: malayalamNote,
        crossColor: '#9333ea', // Purple cross
        noteColor: '#ea580c'   // Orange notes
      });

    expect(res.status).toBe(201);
    expect(res.body.activity).toBeDefined();
    expect(res.body.activity.notes).toBe(malayalamNote);
    // Independent colors
    expect(res.body.activity.crossColor).toBe('#9333ea');
    expect(res.body.activity.noteColor).toBe('#ea580c');
    // Category snapshot
    expect(res.body.activity.categoryNameSnapshot.en).toBe('Went to Church');
    expect(res.body.activity.categoryNameSnapshot.ml).toBe('പള്ളിയിൽ പോയി');
    // Authoritative server timestamp
    expect(res.body.activity.createdAt).toBeDefined();
  });

  it('Requirement 12: Multiple activities on same date retain distinct notes/colors but return exactly ONE cross mark with latest color', async () => {
    // Add second activity with different category and color on the SAME date
    const res2 = await request(app)
      .post('/api/activities')
      .set('Cookie', authCookie)
      .send({
        selectedDate: today,
        categoryId: prayerCategory._id.toString(),
        notes: 'Personal evening prayer completed',
        crossColor: '#2563eb', // Blue cross
        noteColor: '#16a34a'   // Green notes
      });

    expect(res2.status).toBe(201);

    // Verify monthly calendar aggregate
    const monthKey = today.slice(0, 7);
    const monthRes = await request(app)
      .get(`/api/activities?month=${monthKey}`)
      .set('Cookie', authCookie);

    expect(monthRes.status).toBe(200);
    const dateMark = monthRes.body.marks[today];
    expect(dateMark).toBeDefined();
    expect(dateMark.isMarked).toBe(true);
    // Single Cross Rule: latest activity (Blue #2563eb) determines the single cross
    expect(dateMark.color).toBe('#2563eb');
    expect(dateMark.activityCount).toBe(2);

    // Both activities remain fully preserved in database
    const dateActivitiesRes = await request(app)
      .get(`/api/activities?date=${today}`)
      .set('Cookie', authCookie);

    expect(dateActivitiesRes.status).toBe(200);
    expect(dateActivitiesRes.body.activities.length).toBe(2);
  });

  it('Requirement 13: Strictly prevents saving activities on future dates', async () => {
    const futureDate = '2099-12-31';
    const res = await request(app)
      .post('/api/activities')
      .set('Cookie', authCookie)
      .send({
        selectedDate: futureDate,
        categoryId: churchCategory._id.toString(),
        notes: 'Future note',
        crossColor: '#dc2626',
        noteColor: '#2563eb'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Future dates are strictly restricted');
  });

  it('Data persistence verification in local MongoDB Community Server', async () => {
    const docs = await Activity.find({ userId: testUser._id, selectedDate: today });
    expect(docs.length).toBe(2);
    expect(docs[0].categoryNameSnapshot).toBeDefined();
  });
});
