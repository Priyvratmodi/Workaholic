import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';

describe('User Preferences API Integration Tests', () => {
  const testUser = {
    name: 'Theme User',
    email: 'themeuser@workaholic.test',
    password: 'password123',
  };

  let authCookie: string;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const cookies = regRes.headers['set-cookie'];
    authCookie = cookies[0];
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  it('PATCH /users/me/preferences should require authentication (401)', async () => {
    const res = await request(app)
      .patch('/users/me/preferences')
      .send({ themePreference: 'DARK' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('PATCH /users/me/preferences should reject invalid theme values (400)', async () => {
    const res = await request(app)
      .patch('/users/me/preferences')
      .set('Cookie', authCookie)
      .send({ themePreference: 'INVALID_THEME' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH /users/me/preferences should reject invalid reduceMotion values (400)', async () => {
    const res = await request(app)
      .patch('/users/me/preferences')
      .set('Cookie', authCookie)
      .send({ reduceMotion: 'not-a-boolean' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH /users/me/preferences should update preferences successfully', async () => {
    const res = await request(app)
      .patch('/users/me/preferences')
      .set('Cookie', authCookie)
      .send({ themePreference: 'LIGHT', reduceMotion: true });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user.themePreference).toBe('LIGHT');
    expect(res.body.data.user.reduceMotion).toBe(true);
  });

  it('GET /api/auth/me should include the persisted preferences', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.user.themePreference).toBe('LIGHT');
    expect(res.body.data.user.reduceMotion).toBe(true);
  });

  it('PATCH /api/users/me/preferences should update theme back to SYSTEM', async () => {
    const res = await request(app)
      .patch('/api/users/me/preferences')
      .set('Cookie', authCookie)
      .send({ themePreference: 'SYSTEM', reduceMotion: false });

    expect(res.status).toBe(200);
    expect(res.body.data.user.themePreference).toBe('SYSTEM');
    expect(res.body.data.user.reduceMotion).toBe(false);
  });
});
