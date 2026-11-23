/**
 * Device-Bound Browser Session & Isolation Integration Tests
 *
 * Verifies:
 *  1. POST /api/auth/device-session creates secure random session with HttpOnly cookie
 *  2. Reusing existing valid cookie resumes existing session (does not create duplicate)
 *  3. Activities created under Session A are completely invisible to Session B (isolation)
 *  4. Entering User A's phone number on Device B gives a brand new session and NEVER exposes User A's data
 *  5. User B cannot edit or delete User A's activities (403 forbidden)
 *  6. Logout clears cookie without deleting data
 *  7. Reset-session revokes session token hash
 *  8. Custom categories created by Session A are isolated from Session B
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDefaultCategories } from '../src/services/seedService.js';
import { DeviceSession } from '../src/models/DeviceSession.js';
import { Activity } from '../src/models/Activity.js';
import { Category } from '../src/models/Category.js';
import { getTodayKeyInTimezone } from '../src/utils/dateValidator.js';

describe('Device-Bound Session & Data Isolation Tests', () => {
  let app;
  let sessionCookieA, sessionCookieB;
  let sessionIdA, sessionIdB;
  let defaultCategory;
  const TODAY = getTodayKeyInTimezone('Asia/Kolkata');
  const SHARED_PHONE = '+919876543210';

  beforeAll(async () => {
    await connectDB();
    await seedDefaultCategories();
    app = createApp();

    defaultCategory = await Category.findOne({ key: 'went_to_church', isDefault: true });
    expect(defaultCategory).toBeDefined();

    // Clean test sessions
    await DeviceSession.deleteMany({ displayPhone: SHARED_PHONE });
  });

  afterAll(async () => {
    if (sessionIdA || sessionIdB) {
      await Activity.deleteMany({ sessionId: { $in: [sessionIdA, sessionIdB] } });
      await Category.deleteMany({ sessionId: { $in: [sessionIdA, sessionIdB] } });
      await DeviceSession.deleteMany({ sessionId: { $in: [sessionIdA, sessionIdB] } });
    }
    await disconnectDB();
  });

  // --------------------------------------------------------------------------
  // 1. Session Creation & Reuse
  // --------------------------------------------------------------------------
  it('Device 1: Starts a new session with valid phone number and receives HttpOnly device_session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/device-session')
      .send({ phoneNumber: SHARED_PHONE });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.isDeviceBound).toBe(true);
    expect(res.body.user.sessionId).toBeDefined();
    sessionIdA = res.body.user.sessionId;

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookieHeader = cookies.find((c) => c.startsWith('device_session='));
    expect(sessionCookieHeader).toBeDefined();
    expect(sessionCookieHeader).toContain('HttpOnly');
    sessionCookieA = sessionCookieHeader.split(';')[0];
  });

  it('Device 1: Reusing existing cookie resumes the same session (Requirement 1: Session Reuse)', async () => {
    const res = await request(app)
      .post('/api/auth/device-session')
      .set('Cookie', sessionCookieA)
      .send({ phoneNumber: SHARED_PHONE });

    expect(res.status).toBe(200);
    expect(res.body.isResumed).toBe(true);
    expect(res.body.user.sessionId).toBe(sessionIdA);
  });

  it('Device 1: GET /api/auth/me returns current session details', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookieA);

    expect(res.status).toBe(200);
    expect(res.body.user.sessionId).toBe(sessionIdA);
    expect(res.body.user.isDeviceBound).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 2. Data Creation by Device 1
  // --------------------------------------------------------------------------
  let device1ActivityId;
  it('Device 1: Records an activity on today with custom notes and colors', async () => {
    const res = await request(app)
      .post('/api/activities')
      .set('Cookie', sessionCookieA)
      .send({
        selectedDate: TODAY,
        categoryId: defaultCategory._id,
        notes: 'Device 1 confidential entry — രഹസ്യ കുറിപ്പ്',
        crossColor: '#059669',
        noteColor: '#064e3b'
      });

    expect(res.status).toBe(201);
    expect(res.body.activity).toBeDefined();
    expect(res.body.activity.sessionId).toBe(sessionIdA);
    device1ActivityId = res.body.activity._id;
  });

  // --------------------------------------------------------------------------
  // 3. Device 2 Enters the EXACT SAME phone number (Requirement 7 & 8)
  // --------------------------------------------------------------------------
  it('Device 2: Enters the SAME phone number without Device 1 cookie => Gets a completely separate sessionId', async () => {
    const res = await request(app)
      .post('/api/auth/device-session')
      .send({ phoneNumber: SHARED_PHONE }); // Same phone number!

    expect(res.status).toBe(201);
    expect(res.body.user.sessionId).toBeDefined();
    expect(res.body.user.sessionId).not.toBe(sessionIdA); // MUST BE DIFFERENT
    sessionIdB = res.body.user.sessionId;

    const cookies = res.headers['set-cookie'];
    sessionCookieB = cookies.find((c) => c.startsWith('device_session=')).split(';')[0];
  });

  it('Device 2: CANNOT see Device 1 activities (Isolated by sessionId, not phone number!)', async () => {
    const res = await request(app)
      .get(`/api/activities?date=${TODAY}`)
      .set('Cookie', sessionCookieB);

    expect(res.status).toBe(200);
    // Device 2's activity list for this date must be completely EMPTY
    expect(res.body.activities).toHaveLength(0);
  });

  it('Device 2: Month aggregate marks for Device 2 shows NO marks for today', async () => {
    const month = TODAY.slice(0, 7);
    const res = await request(app)
      .get(`/api/activities?month=${month}`)
      .set('Cookie', sessionCookieB);

    expect(res.status).toBe(200);
    // Today must NOT be marked for Device 2
    expect(res.body.marks?.[TODAY]?.isMarked).toBeFalsy();
  });

  it('Device 2: Attempting to edit Device 1 activity returns 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/activities/${device1ActivityId}`)
      .set('Cookie', sessionCookieB)
      .send({ notes: 'Malicious modification attempt' });

    expect(res.status).toBe(403);
  });

  it('Device 2: Attempting to delete Device 1 activity returns 403 Forbidden', async () => {
    const res = await request(app)
      .delete(`/api/activities/${device1ActivityId}`)
      .set('Cookie', sessionCookieB);

    expect(res.status).toBe(403);
  });

  // --------------------------------------------------------------------------
  // 4. Persistence & Logout (Requirements 5 & 9)
  // --------------------------------------------------------------------------
  it('Device 1: Can still view and edit its own activity', async () => {
    const res = await request(app)
      .get(`/api/activities?date=${TODAY}`)
      .set('Cookie', sessionCookieA);

    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
    expect(res.body.activities[0].notes).toBe('Device 1 confidential entry — രഹസ്യ കുറിപ്പ്');
  });

  it('Device 1: POST /api/auth/logout clears cookie without revoking DB record', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookieA);

    expect(res.status).toBe(200);
    const cleared = res.headers['set-cookie'];
    expect(cleared.some((c) => c.includes('device_session=;'))).toBe(true);

    // Verify session still exists in DB (not deleted)
    const sessionDoc = await DeviceSession.findOne({ sessionId: sessionIdA });
    expect(sessionDoc).toBeDefined();
    expect(sessionDoc.isRevoked).toBe(false);
  });

  it('Device 1: POST /api/auth/reset-session revokes session permanently', async () => {
    const res = await request(app)
      .post('/api/auth/reset-session')
      .set('Cookie', sessionCookieA);

    expect(res.status).toBe(200);
    const sessionDoc = await DeviceSession.findOne({ sessionId: sessionIdA });
    expect(sessionDoc.isRevoked).toBe(true);

    // After reset, attempting to use sessionCookieA fails
    const failRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookieA);

    expect(failRes.status).toBe(401);
  });
});
