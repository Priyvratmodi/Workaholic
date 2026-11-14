import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';

describe('Security, RBAC & Last-Owner Protection Tests', () => {
  let ownerCookie: string[];
  let memberCookie: string[];
  let viewerCookie: string[];
  let strangerCookie: string[];
  let boardId: string;
  let ownerUserId: string;
  let memberUserId: string;
  let viewerUserId: string;

  beforeAll(async () => {
    // 1. Log in as owner
    const ownerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@workaholic.test', password: 'password123' });
    ownerCookie = ownerRes.headers['set-cookie'];

    // 2. Log in as member
    const memberRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@workaholic.test', password: 'password123' });
    memberCookie = memberRes.headers['set-cookie'];

    // 3. Log in as viewer
    const viewerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'viewer@workaholic.test', password: 'password123' });
    viewerCookie = viewerRes.headers['set-cookie'];

    // 4. Register stranger
    await prisma.user.deleteMany({ where: { email: 'rbac-stranger@workaholic.test' } });
    const strangerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'RBAC Stranger',
        email: 'rbac-stranger@workaholic.test',
        password: 'password123',
      });
    strangerCookie = strangerRes.headers['set-cookie'];

    // Create a new board for testing
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Cookie', ownerCookie)
      .send({ title: 'RBAC Security Matrix Board' });
    boardId = boardRes.body.board.id;

    // Get user IDs
    const ownerUser = await prisma.user.findUnique({ where: { email: 'owner@workaholic.test' } });
    const memberUser = await prisma.user.findUnique({ where: { email: 'member@workaholic.test' } });
    const viewerUser = await prisma.user.findUnique({ where: { email: 'viewer@workaholic.test' } });

    ownerUserId = ownerUser!.id;
    memberUserId = memberUser!.id;
    viewerUserId = viewerUser!.id;

    // Add member and viewer to board
    await prisma.boardMember.createMany({
      data: [
        { boardId, userId: memberUserId, role: 'member' },
        { boardId, userId: viewerUserId, role: 'viewer' },
      ],
    });
  });

  afterAll(async () => {
    if (boardId) {
      await prisma.board.deleteMany({ where: { id: boardId } });
    }
    await prisma.user.deleteMany({ where: { email: 'rbac-stranger@workaholic.test' } });
    await prisma.$disconnect();
  });

  it('Non-member receives 404 Not Found (not 403) to prevent existence leaking', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Cookie', strangerCookie);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('Viewer can view board but receives 403 Forbidden on writes', async () => {
    // Viewer can view
    const viewRes = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Cookie', viewerCookie);
    expect(viewRes.status).toBe(200);

    // Viewer forbidden from renaming board
    const patchRes = await request(app)
      .patch(`/api/boards/${boardId}`)
      .set('Cookie', viewerCookie)
      .send({ title: 'Hacked Title' });
    expect(patchRes.status).toBe(403);

    // Viewer forbidden from adding list
    const addListRes = await request(app)
      .post(`/api/boards/${boardId}/lists`)
      .set('Cookie', viewerCookie)
      .send({ title: 'Unauthorized List' });
    expect(addListRes.status).toBe(403);
  });

  it('Member cannot invite other members or change roles (403 Forbidden)', async () => {
    const inviteRes = await request(app)
      .post(`/api/boards/${boardId}/members`)
      .set('Cookie', memberCookie)
      .send({ email: 'rbac-stranger@workaholic.test', role: 'member' });

    expect(inviteRes.status).toBe(403);
  });

  it('Last-owner protection: sole owner cannot be demoted to member', async () => {
    const demoteRes = await request(app)
      .patch(`/api/boards/${boardId}/members/${ownerUserId}`)
      .set('Cookie', ownerCookie)
      .send({ role: 'member' });

    expect(demoteRes.status).toBe(400);
    expect(demoteRes.body.error.code).toBe('LAST_OWNER_PROTECTED');
  });

  it('Last-owner protection: sole owner cannot leave or be removed', async () => {
    const removeRes = await request(app)
      .delete(`/api/boards/${boardId}/members/${ownerUserId}`)
      .set('Cookie', ownerCookie);

    expect(removeRes.status).toBe(400);
    expect(removeRes.body.error.code).toBe('LAST_OWNER_PROTECTED');
  });

  it('Promoting second owner allows demotion/removal of original owner', async () => {
    // 1. Promote member to owner
    const promoteRes = await request(app)
      .patch(`/api/boards/${boardId}/members/${memberUserId}`)
      .set('Cookie', ownerCookie)
      .send({ role: 'owner' });

    expect(promoteRes.status).toBe(200);
    expect(promoteRes.body.member.role).toBe('owner');

    // 2. Now original owner can demote self to member
    const demoteRes = await request(app)
      .patch(`/api/boards/${boardId}/members/${ownerUserId}`)
      .set('Cookie', ownerCookie)
      .send({ role: 'member' });

    expect(demoteRes.status).toBe(200);
    expect(demoteRes.body.member.role).toBe('member');
  });
});
