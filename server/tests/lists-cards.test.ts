import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';
import { getPositionBetween } from '@workaholic/shared';

describe('Lists & Cards API Integration Tests', () => {
  let ownerCookie: string[];
  let viewerCookie: string[];
  let boardId: string;
  let list1Id: string;
  let list2Id: string;
  let cardId: string;

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

    // 3. Create a test board
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Cookie', ownerCookie)
      .send({ title: 'Kanban Testing Board' });
    boardId = boardRes.body.board.id;

    // Fetch created lists
    const boardBundle = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Cookie', ownerCookie);
    list1Id = boardBundle.body.board.lists[0].id;
    list2Id = boardBundle.body.board.lists[1].id;

    // Add viewer to board for permission testing
    const viewerUser = await prisma.user.findUnique({
      where: { email: 'viewer@workaholic.test' },
    });
    await prisma.boardMember.create({
      data: {
        boardId,
        userId: viewerUser!.id,
        role: 'viewer',
      },
    });
  });

  afterAll(async () => {
    if (boardId) {
      await prisma.board.deleteMany({ where: { id: boardId } });
    }
    await prisma.$disconnect();
  });

  it('POST /api/boards/:id/lists should add a new list', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/lists`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Archived Sprints',
        emoji: '📦',
      });

    expect(res.status).toBe(201);
    expect(res.body.list).toBeDefined();
    expect(res.body.list.title).toBe('Archived Sprints');
    expect(res.body.list.emoji).toBe('📦');
  });

  it('PATCH /api/lists/:id should update list title', async () => {
    const res = await request(app)
      .patch(`/api/lists/${list1Id}`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Incoming Requests',
        emoji: '📥',
      });

    expect(res.status).toBe(200);
    expect(res.body.list.title).toBe('Incoming Requests');
    expect(res.body.list.emoji).toBe('📥');
  });

  it('POST /api/lists/:listId/cards should create a new card in the list', async () => {
    const res = await request(app)
      .post(`/api/lists/${list1Id}/cards`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Design high-fidelity prototype',
        description: 'Using Stitch token references and Tailwind classes.',
      });

    expect(res.status).toBe(201);
    expect(res.body.card).toBeDefined();
    expect(res.body.card.title).toBe('Design high-fidelity prototype');
    expect(res.body.card.listId).toBe(list1Id);

    cardId = res.body.card.id;
  });

  it('PATCH /api/cards/:id should move card to another list (updates exactly 1 row)', async () => {
    // Generate fractional index position for destination list
    const newPos = getPositionBetween(null, null);

    const res = await request(app)
      .patch(`/api/cards/${cardId}`)
      .set('Cookie', ownerCookie)
      .send({
        listId: list2Id,
        position: newPos,
      });

    expect(res.status).toBe(200);
    expect(res.body.card.id).toBe(cardId);
    expect(res.body.card.listId).toBe(list2Id);
    expect(res.body.card.position).toBe(newPos);

    // Verify in DB that card now belongs to list2
    const inDb = await prisma.card.findUnique({
      where: { id: cardId },
    });
    expect(inDb?.listId).toBe(list2Id);
  });

  it('PATCH /api/cards/:id should update status and completion', async () => {
    const res = await request(app)
      .patch(`/api/cards/${cardId}`)
      .set('Cookie', ownerCookie)
      .send({
        isComplete: true,
        dueDate: '2026-12-31T23:59:59.000Z',
      });

    expect(res.status).toBe(200);
    expect(res.body.card.isComplete).toBe(true);
    expect(res.body.card.dueDate).toContain('2026-12-31');
  });

  it('Viewer should be forbidden (403) from creating or updating cards', async () => {
    const createRes = await request(app)
      .post(`/api/lists/${list1Id}/cards`)
      .set('Cookie', viewerCookie)
      .send({ title: 'Unauthorized card' });

    expect(createRes.status).toBe(403);

    const updateRes = await request(app)
      .patch(`/api/cards/${cardId}`)
      .set('Cookie', viewerCookie)
      .send({ title: 'Hacked card' });

    expect(updateRes.status).toBe(403);
  });

  it('PATCH /api/lists/:id should update list color and persist in board bundle', async () => {
    const res = await request(app)
      .patch(`/api/lists/${list1Id}`)
      .set('Cookie', ownerCookie)
      .send({
        color: 'sky',
      });

    expect(res.status).toBe(200);
    expect(res.body.list.color).toBe('sky');

    // Verify GET /api/boards/:id returns the list with the updated color
    const boardBundle = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Cookie', ownerCookie);

    expect(boardBundle.status).toBe(200);
    const updatedList = boardBundle.body.board.lists.find((l: any) => l.id === list1Id);
    expect(updatedList).toBeDefined();
    expect(updatedList.color).toBe('sky');
  });

  it('DELETE /api/cards/:id should delete card', async () => {
    const res = await request(app)
      .delete(`/api/cards/${cardId}`)
      .set('Cookie', ownerCookie);

    expect(res.status).toBe(200);

    const inDb = await prisma.card.findUnique({
      where: { id: cardId },
    });
    expect(inDb).toBeNull();
  });
});
