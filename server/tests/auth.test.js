import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

describe('Phone OTP Authentication API', () => {
  let app;

  beforeAll(async () => {
    await connectDB();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  const testPhone = '9876543210';
  let devOtp = null;
  let authCookie = null;

  it('rejects invalid phone numbers', async () => {
    const res = await request(app)
      .post('/api/auth/request-otp')
      .send({ phoneNumber: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('requests OTP for a valid Indian phone number (+91 / 10-digit)', async () => {
    const res = await request(app)
      .post('/api/auth/request-otp')
      .send({ phoneNumber: testPhone });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('OTP sent successfully');
    expect(res.body.devOtp).toBeDefined();
    devOtp = res.body.devOtp;
  });

  it('fails verification with incorrect OTP', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: testPhone, otp: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid OTP');
  });

  it('successfully verifies correct OTP, creates user, and sets HTTP-only cookie', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: testPhone, otp: devOtp });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.phoneNumber).toBe(`+91${testPhone}`);

    // Verify Set-Cookie header contains token and HttpOnly
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = cookies.find((c) => c.startsWith('token='));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('HttpOnly');
    authCookie = tokenCookie;
  });

  it('GET /api/auth/me returns current user when HTTP-only cookie is passed', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.user.phoneNumber).toBe(`+91${testPhone}`);
  });

  it('GET /api/auth/me returns 401 when no cookie is sent', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/logout clears the authentication cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = cookies.find((c) => c.startsWith('token='));
    expect(tokenCookie).toContain('token=;');
  });
});
