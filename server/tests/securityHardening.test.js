/**
 * Production CORS, CSRF Origin/Referer, cookie path, and owner isolation.
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
import { redactSecrets } from '../src/utils/logRedact.js';

const PROD_ORIGIN = 'https://mylife-calendar.example';
const EVIL_ORIGIN = 'https://evil.example';
const LOCAL_ORIGIN = 'http://localhost:5173';
const PHONE_A = '+919700000001';
const PHONE_B = '+919700000002';
const TODAY = getTodayKeyInTimezone('Asia/Kolkata');

const createProdApp = () => createApp({
  NODE_ENV: 'production',
  CLIENT_ORIGIN: PROD_ORIGIN
});

const cookieFrom = (res) => {
  const cookies = res.headers['set-cookie'] || [];
  const header = cookies.find((c) => c.startsWith('device_session='));
  return header ? header.split(';')[0] : null;
};

describe('Security hardening', () => {
  let prodApp;
  let defaultCategory;
  let cookieA;
  let cookieB;
  let sessionIdA;
  let sessionIdB;
  let activityAId;
  let categoryAId;

  beforeAll(async () => {
    await connectDB();
    await seedDefaultCategories();
    prodApp = createProdApp();
    defaultCategory = await Category.findOne({ key: 'went_to_church', isDefault: true });
    expect(defaultCategory).toBeDefined();
    await DeviceSession.deleteMany({ displayPhone: { $in: [PHONE_A, PHONE_B] } });
  });

  afterAll(async () => {
    await Activity.deleteMany({ sessionId: { $in: [sessionIdA, sessionIdB].filter(Boolean) } });
    await Category.deleteMany({ sessionId: { $in: [sessionIdA, sessionIdB].filter(Boolean) } });
    await DeviceSession.deleteMany({ displayPhone: { $in: [PHONE_A, PHONE_B] } });
    await disconnectDB();
  });

  it('does not allow an unauthorized origin in production CORS', async () => {
    const res = await request(prodApp)
      .get('/api/health')
      .set('Origin', EVIL_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('does not allow localhost origins in production CORS', async () => {
    const res = await request(prodApp)
      .get('/api/health')
      .set('Origin', LOCAL_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows the configured production frontend origin', async () => {
    const res = await request(prodApp)
      .get('/api/health')
      .set('Origin', PROD_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(PROD_ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects mutating CSRF from an unauthorized Origin even with a session cookie later', async () => {
    const res = await request(prodApp)
      .post('/api/auth/device-session')
      .set('Origin', EVIL_ORIGIN)
      .send({ phoneNumber: PHONE_A });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Cross-site request blocked.');
  });

  it('rejects mutating production requests with neither Origin nor Referer', async () => {
    const res = await request(prodApp)
      .post('/api/auth/device-session')
      .send({ phoneNumber: PHONE_A });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Cross-site request blocked.');
  });

  it('accepts device-session creation from the allowed Origin and sets Path=/ HttpOnly cookie', async () => {
    const res = await request(prodApp)
      .post('/api/auth/device-session')
      .set('Origin', PROD_ORIGIN)
      .send({ phoneNumber: PHONE_A });

    expect(res.status).toBe(201);
    sessionIdA = res.body.user.sessionId;
    const setCookie = (res.headers['set-cookie'] || []).find((c) => c.startsWith('device_session='));
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toMatch(/Path=\//i);
    cookieA = cookieFrom(res);
    expect(cookieA).toBeTruthy();
  });

  it('accepts mutating requests that only send a matching Referer', async () => {
    const res = await request(prodApp)
      .post('/api/auth/device-session')
      .set('Origin', PROD_ORIGIN)
      .send({ phoneNumber: PHONE_B });

    expect(res.status).toBe(201);
    sessionIdB = res.body.user.sessionId;
    cookieB = cookieFrom(res);

    const resume = await request(prodApp)
      .post('/api/auth/device-session')
      .set('Cookie', cookieB)
      .set('Referer', `${PROD_ORIGIN}/calendar`)
      .send({ phoneNumber: PHONE_B });

    expect(resume.status).toBe(200);
    expect(resume.body.isResumed).toBe(true);
    expect(resume.body.user.sessionId).toBe(sessionIdB);
  });

  it('creates an activity and custom category for session A from the allowed origin', async () => {
    const catRes = await request(prodApp)
      .post('/api/categories')
      .set('Cookie', cookieA)
      .set('Origin', PROD_ORIGIN)
      .send({ nameEn: 'Private Garden', nameMl: 'സ്വകാര്യ തോട്ടം' });

    expect(catRes.status).toBe(201);
    categoryAId = catRes.body.category._id;

    const actRes = await request(prodApp)
      .post('/api/activities')
      .set('Cookie', cookieA)
      .set('Origin', PROD_ORIGIN)
      .send({
        selectedDate: TODAY,
        categoryId: defaultCategory._id,
        notes: 'Session A secret — രഹസ്യം',
        crossColor: '#059669',
        noteColor: '#064e3b'
      });

    expect(actRes.status).toBe(201);
    activityAId = actRes.body.activity._id;
  });

  it('blocks CSRF PATCH/DELETE of session A data from an evil origin using session A cookies', async () => {
    const patchRes = await request(prodApp)
      .patch(`/api/activities/${activityAId}`)
      .set('Cookie', cookieA)
      .set('Origin', EVIL_ORIGIN)
      .send({ notes: 'forged notes' });

    expect(patchRes.status).toBe(403);

    const deleteRes = await request(prodApp)
      .delete(`/api/activities/${activityAId}`)
      .set('Cookie', cookieA)
      .set('Origin', EVIL_ORIGIN);

    expect(deleteRes.status).toBe(403);
  });

  it('isolates sessions: B cannot see, edit, or delete A activities', async () => {
    const listRes = await request(prodApp)
      .get(`/api/activities?date=${TODAY}`)
      .set('Cookie', cookieB)
      .set('Origin', PROD_ORIGIN);

    expect(listRes.status).toBe(200);
    expect(listRes.body.activities).toHaveLength(0);

    const patchRes = await request(prodApp)
      .patch(`/api/activities/${activityAId}`)
      .set('Cookie', cookieB)
      .set('Origin', PROD_ORIGIN)
      .send({ notes: 'cross-session edit' });

    expect(patchRes.status).toBe(403);

    const deleteRes = await request(prodApp)
      .delete(`/api/activities/${activityAId}`)
      .set('Cookie', cookieB)
      .set('Origin', PROD_ORIGIN);

    expect(deleteRes.status).toBe(403);
  });

  it('isolates sessions: B cannot edit or delete A custom categories', async () => {
    const listRes = await request(prodApp)
      .get('/api/categories')
      .set('Cookie', cookieB)
      .set('Origin', PROD_ORIGIN);

    expect(listRes.status).toBe(200);
    const ids = listRes.body.categories.map((c) => c._id);
    expect(ids).not.toContain(categoryAId);

    const patchRes = await request(prodApp)
      .patch(`/api/categories/${categoryAId}`)
      .set('Cookie', cookieB)
      .set('Origin', PROD_ORIGIN)
      .send({ nameEn: 'Hijacked' });

    expect(patchRes.status).toBe(403);

    const deleteRes = await request(prodApp)
      .delete(`/api/categories/${categoryAId}`)
      .set('Cookie', cookieB)
      .set('Origin', PROD_ORIGIN);

    expect(deleteRes.status).toBe(403);
  });

  it('lets session A edit its own activity from the allowed origin', async () => {
    const res = await request(prodApp)
      .patch(`/api/activities/${activityAId}`)
      .set('Cookie', cookieA)
      .set('Origin', PROD_ORIGIN)
      .send({ notes: 'Updated by owner — അപ്ഡേറ്റ്' });

    expect(res.status).toBe(200);
    expect(res.body.activity.notes).toBe('Updated by owner — അപ്ഡേറ്റ്');
  });

  it('does not put MongoDB URIs into redacted log text', () => {
    const leaked = 'failed mongodb://user:secret@127.0.0.1:27017/MyLifeCalendar';
    expect(redactSecrets(leaked)).not.toContain('mongodb://');
    expect(redactSecrets(leaked)).not.toContain('secret@');
  });
});
