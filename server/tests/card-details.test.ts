import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';

describe('Card Details API Integration Tests', () => {
  let ownerCookie: string[];
  let boardId: string;
  let cardId: string;
  let labelId: string;
  let memberUserId: string;

  beforeAll(async () => {
    // 1. Log in as owner
    const ownerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@workaholic.test', password: 'password123' });
    ownerCookie = ownerRes.headers['set-cookie'];

    // 2. Create board
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Cookie', ownerCookie)
      .send({ title: 'Card Details Test Board' });
    boardId = boardRes.body.board.id;

    // Get board bundle
    const boardBundle = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Cookie', ownerCookie);

    cardId = boardBundle.body.board.lists[0].cards[0].id;
    labelId = boardBundle.body.board.labels[0].id;

    const memberUser = await prisma.user.findUnique({
      where: { email: 'member@workaholic.test' },
    });
    memberUserId = memberUser!.id;
  });

  afterAll(async () => {
    if (boardId) {
      await prisma.board.deleteMany({ where: { id: boardId } });
    }
    await prisma.$disconnect();
  });

  it('GET /api/cards/:id should return full card details', async () => {
    const res = await request(app)
      .get(`/api/cards/${cardId}`)
      .set('Cookie', ownerCookie);

    expect(res.status).toBe(200);
    expect(res.body.card).toBeDefined();
    expect(res.body.card.id).toBe(cardId);
    expect(Array.isArray(res.body.card.checklists)).toBe(true);
    expect(Array.isArray(res.body.card.comments)).toBe(true);
    expect(Array.isArray(res.body.card.activities)).toBe(true);
  });

  it('POST /api/cards/:id/checklists and item operations should manage checklists', async () => {
    // 1. Create checklist
    const clRes = await request(app)
      .post(`/api/cards/${cardId}/checklists`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Acceptance Criteria' });

    expect(clRes.status).toBe(201);
    expect(clRes.body.checklist.title).toBe('Acceptance Criteria');
    const checklistId = clRes.body.checklist.id;

    // 2. Add checklist item
    const itemRes = await request(app)
      .post(`/api/checklists/${checklistId}/items`)
      .set('Cookie', ownerCookie)
      .send({ text: 'Ensure test coverage is 100%' });

    expect(itemRes.status).toBe(201);
    expect(itemRes.body.item.text).toBe('Ensure test coverage is 100%');
    expect(itemRes.body.item.isDone).toBe(false);
    const itemId = itemRes.body.item.id;

    // 3. Mark item done
    const updateItemRes = await request(app)
      .patch(`/api/checklist-items/${itemId}`)
      .set('Cookie', ownerCookie)
      .send({ isDone: true });

    expect(updateItemRes.status).toBe(200);
    expect(updateItemRes.body.item.isDone).toBe(true);

    // 4. Delete item
    const delItemRes = await request(app)
      .delete(`/api/checklist-items/${itemId}`)
      .set('Cookie', ownerCookie);
    expect(delItemRes.status).toBe(200);
  });

  it('POST /api/cards/:id/comments should add a comment', async () => {
    const res = await request(app)
      .post(`/api/cards/${cardId}/comments`)
      .set('Cookie', ownerCookie)
      .send({ body: 'Reviewing the design tokens now.' });

    expect(res.status).toBe(201);
    expect(res.body.comment.body).toBe('Reviewing the design tokens now.');
    expect(res.body.comment.user).toBeDefined();
    expect(res.body.comment.user.name).toBe('Aarav Patel');
  });

  it('POST and DELETE /api/cards/:id/members should assign and unassign member', async () => {
    // Assign member
    const assignRes = await request(app)
      .post(`/api/cards/${cardId}/members`)
      .set('Cookie', ownerCookie)
      .send({ userId: memberUserId });

    expect(assignRes.status).toBe(201);
    expect(assignRes.body.user.id).toBe(memberUserId);

    // Unassign member
    const unassignRes = await request(app)
      .delete(`/api/cards/${cardId}/members/${memberUserId}`)
      .set('Cookie', ownerCookie);

    expect(unassignRes.status).toBe(200);
  });

  it('POST and DELETE /api/cards/:id/labels should assign and unassign label', async () => {
    // Assign label
    const assignRes = await request(app)
      .post(`/api/cards/${cardId}/labels`)
      .set('Cookie', ownerCookie)
      .send({ labelId });

    expect(assignRes.status).toBe(201);
    expect(assignRes.body.label.id).toBe(labelId);

    // Unassign label
    const unassignRes = await request(app)
      .delete(`/api/cards/${cardId}/labels/${labelId}`)
      .set('Cookie', ownerCookie);

    expect(unassignRes.status).toBe(200);
  });

  it('POST and DELETE /api/cards/:id/attachments should add and delete attachment', async () => {
    const res = await request(app)
      .post(`/api/cards/${cardId}/attachments`)
      .set('Cookie', ownerCookie)
      .send({
        name: 'Design_Tokens_v2.fig',
        url: 'https://figma.com/file/sample',
        size: 1048576,
      });

    expect(res.status).toBe(201);
    expect(res.body.attachment.name).toBe('Design_Tokens_v2.fig');
    const attachmentId = res.body.attachment.id;

    // Delete attachment
    const delRes = await request(app)
      .delete(`/api/attachments/${attachmentId}`)
      .set('Cookie', ownerCookie);

    expect(delRes.status).toBe(200);
  });
});
