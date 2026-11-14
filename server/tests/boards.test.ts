import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';
import { PROJECT_MANAGEMENT_TEMPLATE } from '@workaholic/shared';

describe('Board & Template API Integration Tests', () => {
  let ownerCookie: string[];
  let viewerCookie: string[];
  let strangerCookie: string[];
  let createdBoardId: string;

  beforeAll(async () => {
    // 1. Log in as owner
    const ownerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@workaholic.test', password: 'password123' });
    ownerCookie = ownerRes.headers['set-cookie'];

    // 2. Log in as viewer
    const viewerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'viewer@workaholic.test', password: 'password123' });
    viewerCookie = viewerRes.headers['set-cookie'];

    // 3. Register a stranger (not on any seeded board)
    await prisma.user.deleteMany({ where: { email: 'stranger@workaholic.test' } });
    const strangerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Stranger Danger',
        email: 'stranger@workaholic.test',
        password: 'password123',
      });
    strangerCookie = strangerRes.headers['set-cookie'];
  });

  afterAll(async () => {
    if (createdBoardId) {
      await prisma.board.deleteMany({ where: { id: createdBoardId } });
    }
    await prisma.user.deleteMany({ where: { email: 'stranger@workaholic.test' } });
    await prisma.$disconnect();
  });

  it('GET /api/templates should return available templates including Project Management', async () => {
    const res = await request(app).get('/api/templates');
    expect(res.status).toBe(200);
    expect(res.body.templates).toBeDefined();
    expect(res.body.templates.length).toBeGreaterThan(0);
    const pmTemplate = res.body.templates.find(
      (t: any) => t.id === PROJECT_MANAGEMENT_TEMPLATE.id
    );
    expect(pmTemplate).toBeDefined();
    expect(pmTemplate.lists.length).toBe(6);
  });

  it('POST /api/boards should require authentication', async () => {
    const res = await request(app)
      .post('/api/boards')
      .send({ title: 'Unauthenticated Board' });
    expect(res.status).toBe(401);
  });

  it('POST /api/boards should create a board with default Project Management template', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Cookie', ownerCookie)
      .send({
        title: 'Q4 Product Roadmap',
        background: 'gradient-3',
      });

    expect(res.status).toBe(201);
    expect(res.body.board).toBeDefined();
    expect(res.body.board.title).toBe('Q4 Product Roadmap');
    expect(res.body.board.background).toBe('gradient-3');

    createdBoardId = res.body.board.id;

    // Verify in DB that all 6 lists and starter cards were created
    const lists = await prisma.list.findMany({
      where: { boardId: createdBoardId },
      include: { cards: true },
      orderBy: { position: 'asc' },
    });

    expect(lists.length).toBe(6);
    expect(lists.map((l) => l.title)).toEqual([
      'Resources (Start Here!)',
      'Questions For Next Meeting',
      'To Do',
      'Pending',
      'Blocked',
      'Done',
    ]);

    // Check first list starter card
    expect(lists[0].cards.length).toBe(1);
    expect(lists[0].cards[0].title).toBe('How to use this list');
    expect(lists[0].cards[0].description).toBe(
      PROJECT_MANAGEMENT_TEMPLATE.lists[0].starterCard.description
    );
  });

  it('GET /api/boards should list user boards with role and summary stats', async () => {
    const res = await request(app)
      .get('/api/boards')
      .set('Cookie', ownerCookie);

    expect(res.status).toBe(200);
    expect(res.body.boards).toBeDefined();
    const board = res.body.boards.find((b: any) => b.id === createdBoardId);
    expect(board).toBeDefined();
    expect(board.userRole).toBe('owner');
    expect(board.isStarred).toBe(false);
    expect(board.members.length).toBeGreaterThan(0);
    expect(typeof board.activeTasksCount).toBe('number');
  });

  it('GET /api/boards/:id should return 404 for stranger (not leaking existence)', async () => {
    const res = await request(app)
      .get(`/api/boards/${createdBoardId}`)
      .set('Cookie', strangerCookie);

    // Security requirement: 404 Not Found, not 403
    expect(res.status).toBe(404);
  });

  it('GET /api/boards/:id should return full board bundle for owner', async () => {
    const res = await request(app)
      .get(`/api/boards/${createdBoardId}`)
      .set('Cookie', ownerCookie);

    expect(res.status).toBe(200);
    expect(res.body.board).toBeDefined();
    expect(res.body.board.id).toBe(createdBoardId);
    expect(res.body.board.lists.length).toBe(6);
    expect(res.body.board.userRole).toBe('owner');
    expect(res.body.board.labels.length).toBeGreaterThan(0);
  });

  it('POST /api/boards/:id/star and DELETE /api/boards/:id/star should toggle star', async () => {
    // Star board
    const starRes = await request(app)
      .post(`/api/boards/${createdBoardId}/star`)
      .set('Cookie', ownerCookie);
    expect(starRes.status).toBe(200);
    expect(starRes.body.isStarred).toBe(true);

    // Verify list reflects star
    const listRes = await request(app)
      .get('/api/boards')
      .set('Cookie', ownerCookie);
    const starredBoard = listRes.body.boards.find((b: any) => b.id === createdBoardId);
    expect(starredBoard.isStarred).toBe(true);

    // Unstar board
    const unstarRes = await request(app)
      .delete(`/api/boards/${createdBoardId}/star`)
      .set('Cookie', ownerCookie);
    expect(unstarRes.status).toBe(200);
    expect(unstarRes.body.isStarred).toBe(false);
  });

  it('PATCH /api/boards/:id should update board title and background', async () => {
    const res = await request(app)
      .patch(`/api/boards/${createdBoardId}`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Q4 Product Roadmap - Updated',
        background: 'gradient-5',
      });

    expect(res.status).toBe(200);
    expect(res.body.board.title).toBe('Q4 Product Roadmap - Updated');
    expect(res.body.board.background).toBe('gradient-5');
  });

  it('GET /api/boards/:id/activity should return activity log', async () => {
    const res = await request(app)
      .get(`/api/boards/${createdBoardId}/activity`)
      .set('Cookie', ownerCookie);

    expect(res.status).toBe(200);
    expect(res.body.activities).toBeDefined();
    expect(res.body.activities.length).toBeGreaterThan(0);
  });
});
