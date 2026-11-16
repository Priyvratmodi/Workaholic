import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateKeyBetween } from 'fractional-indexing';
import { PROJECT_MANAGEMENT_TEMPLATE } from '@workaholic/shared';

const prisma = new PrismaClient();

const SEED_BOARD_ID = '9390d770-7d29-41fa-9b81-f363406ada9f';

async function main() {
  // 1. Production safety guard
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    console.warn('⚠️ Database seeding is disabled in production to protect existing data.');
    console.warn('   To run manually, specify ALLOW_PRODUCTION_SEED=true.');
    return;
  }

  console.log('🌱 Starting idempotent database seed...');

  // 2. Seed Default Template (Upsert)
  console.log('Upserting Default Template...');
  await prisma.template.upsert({
    where: { id: PROJECT_MANAGEMENT_TEMPLATE.id },
    update: {
      name: PROJECT_MANAGEMENT_TEMPLATE.name,
      tagline: PROJECT_MANAGEMENT_TEMPLATE.tagline,
      description: PROJECT_MANAGEMENT_TEMPLATE.description,
      structure: JSON.stringify(PROJECT_MANAGEMENT_TEMPLATE),
      isDefault: true,
    },
    create: {
      id: PROJECT_MANAGEMENT_TEMPLATE.id,
      name: PROJECT_MANAGEMENT_TEMPLATE.name,
      tagline: PROJECT_MANAGEMENT_TEMPLATE.tagline,
      description: PROJECT_MANAGEMENT_TEMPLATE.description,
      structure: JSON.stringify(PROJECT_MANAGEMENT_TEMPLATE),
      isDefault: true,
    },
  });

  // 3. Seed Demo Users (Upsert by unique email)
  console.log('Upserting Demo Users...');
  const defaultPassword = 'password123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@workaholic.test' },
    update: { name: 'Aarav Patel' },
    create: {
      name: 'Aarav Patel',
      email: 'owner@workaholic.test',
      passwordHash,
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@workaholic.test' },
    update: { name: 'Jessica Diaz' },
    create: {
      name: 'Jessica Diaz',
      email: 'member@workaholic.test',
      passwordHash,
      avatarUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@workaholic.test' },
    update: { name: 'Sophia Liu' },
    create: {
      name: 'Sophia Liu',
      email: 'viewer@workaholic.test',
      passwordHash,
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('Users ready:');
  console.log('  Owner:  owner@workaholic.test (password: password123)');
  console.log('  Member: member@workaholic.test (password: password123)');
  console.log('  Viewer: viewer@workaholic.test (password: password123)');

  // 4. Seed Sample Board: "Project Management" (Idempotent check)
  const existingBoard = await prisma.board.findUnique({
    where: { id: SEED_BOARD_ID },
  });

  if (existingBoard) {
    console.log('ℹ️ Sample Board already exists, skipping creation.');
    console.log('✅ Seed completed idempotently without resetting any data.');
    return;
  }

  console.log('Seeding Sample Board...');
  const board = await prisma.board.create({
    data: {
      id: SEED_BOARD_ID,
      title: 'Project Management',
      background: 'gradient-1',
    },
  });

  // Star board for owner
  await prisma.boardStar.upsert({
    where: {
      boardId_userId: { boardId: board.id, userId: owner.id },
    },
    update: {},
    create: {
      boardId: board.id,
      userId: owner.id,
    },
  });

  // Add all 3 users as board members with matching roles
  await prisma.boardMember.createMany({
    data: [
      { boardId: board.id, userId: owner.id, role: 'owner' },
      { boardId: board.id, userId: member.id, role: 'member' },
      { boardId: board.id, userId: viewer.id, role: 'viewer' },
    ],
    skipDuplicates: true,
  });

  // 5. Seed Board Labels
  const labels = await Promise.all([
    prisma.label.create({ data: { boardId: board.id, name: 'Design System', color: '#4BCE97' } }),
    prisma.label.create({ data: { boardId: board.id, name: 'High Priority', color: '#F87168' } }),
    prisma.label.create({ data: { boardId: board.id, name: 'Engineering', color: '#9F8FEF' } }),
    prisma.label.create({ data: { boardId: board.id, name: 'Content', color: '#F5CD47' } }),
    prisma.label.create({ data: { boardId: board.id, name: 'Research', color: '#579DFF' } }),
  ]);

  const [lblDesign, lblHighPri, lblEng, lblContent, _lblResearch] = labels;

  // 6. Seed the 6 Template Lists and Starter Cards
  let lastListPos: string | null = null;
  const createdLists = [];

  for (const listDef of PROJECT_MANAGEMENT_TEMPLATE.lists) {
    const listPos = generateKeyBetween(lastListPos, null);
    lastListPos = listPos;

    const list = await prisma.list.create({
      data: {
        boardId: board.id,
        title: listDef.title,
        emoji: listDef.emoji,
        position: listPos,
      },
    });
    createdLists.push(list);

    // Add starter card
    const cardPos = generateKeyBetween(null, null);
    await prisma.card.create({
      data: {
        listId: list.id,
        title: listDef.starterCard.title,
        description: listDef.starterCard.description,
        position: cardPos,
      },
    });
  }

  // 7. Seed extra realistic cards across lists
  const [listResources, listQuestions, listTodo, listPending, listBlocked, listDone] = createdLists;

  // Extra in Resources
  let pos = generateKeyBetween(null, null);
  await prisma.card.create({
    data: {
      listId: listResources.id,
      title: 'Project brief & specs',
      description: 'Comprehensive specifications and architecture documentation for the team.',
      position: (pos = generateKeyBetween(pos, null)),
      members: { create: { userId: owner.id } },
      labels: { create: { labelId: lblDesign.id } },
      attachments: {
        create: [
          { name: 'architecture-spec-v1.pdf', url: 'https://example.com/spec.pdf', size: 2450000, mimeType: 'application/pdf' },
          { name: 'tokens-v2.json', url: 'https://example.com/tokens.json', size: 12000, mimeType: 'application/json' },
        ],
      },
    },
  });

  await prisma.card.create({
    data: {
      listId: listResources.id,
      title: 'Meeting schedule & cadence',
      description: 'Weekly team sync every Monday at 10:00 AM PST.',
      position: generateKeyBetween(pos, null),
      members: { create: { userId: member.id } },
    },
  });

  // Extra in Questions
  pos = generateKeyBetween(null, null);
  const cardBudget = await prisma.card.create({
    data: {
      listId: listQuestions.id,
      title: 'Who approves the Q4 cloud infrastructure budget?',
      description: 'Need confirmation before deploying Datadog and Redis instances.',
      position: (pos = generateKeyBetween(pos, null)),
      members: { create: { userId: member.id } },
      labels: { create: { labelId: lblEng.id } },
      comments: {
        create: [
          { userId: owner.id, body: 'Finance committee reviews this Thursday at 2 PM.' },
          { userId: member.id, body: 'Thanks, I will prepare the cost estimates spreadsheet.' },
        ],
      },
    },
  });

  // Extra in To Do
  pos = generateKeyBetween(null, null);
  const cardLogin = await prisma.card.create({
    data: {
      listId: listTodo.id,
      title: 'Build login and registration screens',
      description: 'Match taskflow_login/code.html with glassmorphic floating preview cards.',
      position: (pos = generateKeyBetween(pos, null)),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      members: { create: { userId: owner.id } },
      labels: { create: [{ labelId: lblHighPri.id }, { labelId: lblDesign.id }] },
    },
  });

  await prisma.card.create({
    data: {
      listId: listTodo.id,
      title: 'Write REST API documentation and Zod schema guides',
      description: 'Document endpoints, error codes, and permission matrices.',
      position: generateKeyBetween(pos, null),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      members: { create: { userId: member.id } },
      labels: { create: { labelId: lblContent.id } },
      checklists: {
        create: {
          title: 'Documentation Scope',
          position: 'a0',
          items: {
            create: [
              { text: 'Auth endpoints (/api/auth)', isDone: true, position: 'a0' },
              { text: 'Board & list mutations (/api/boards)', isDone: true, position: 'a1' },
              { text: 'Card extras (checklists, comments)', isDone: false, position: 'a2' },
              { text: 'RBAC error code catalog', isDone: false, position: 'a3' },
            ],
          },
        },
      },
    },
  });

  // Extra in Pending
  await prisma.card.create({
    data: {
      listId: listPending.id,
      title: 'Waiting on client security sign-off',
      description: 'SOC2 questionnaire submitted to client compliance team.',
      position: generateKeyBetween(null, null),
      members: { create: { userId: owner.id } },
      comments: {
        create: { userId: owner.id, body: 'Followed up via email today.' },
      },
    },
  });

  // Extra in Blocked
  await prisma.card.create({
    data: {
      listId: listBlocked.id,
      title: 'Blocked: Third-party API credentials missing',
      description: 'Awaiting webhook endpoint secrets from payment provider.',
      position: generateKeyBetween(null, null),
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue
      members: { create: { userId: viewer.id } },
      labels: { create: { labelId: lblHighPri.id } },
      comments: {
        create: { userId: viewer.id, body: 'Ticket escalated with vendor support.' },
      },
    },
  });

  // Extra in Done
  pos = generateKeyBetween(null, null);
  await prisma.card.create({
    data: {
      listId: listDone.id,
      title: 'Kickoff meeting and scope alignment',
      description: 'Reviewed design tokens and team workflow.',
      position: (pos = generateKeyBetween(pos, null)),
      isComplete: true,
      members: { create: [{ userId: owner.id }, { userId: member.id }] },
    },
  });

  await prisma.card.create({
    data: {
      listId: listDone.id,
      title: 'Design System Tokens v2.0 published',
      description: 'Tokens exported into Tailwind CSS configuration and CSS variables.',
      position: generateKeyBetween(pos, null),
      isComplete: true,
      members: { create: { userId: owner.id } },
      labels: { create: { labelId: lblDesign.id } },
    },
  });

  // 8. Board Activities
  await prisma.activity.createMany({
    data: [
      {
        boardId: board.id,
        userId: owner.id,
        type: 'board_created',
        payload: JSON.stringify({ user: owner.name, title: board.title }),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        boardId: board.id,
        cardId: cardLogin.id,
        userId: owner.id,
        type: 'card_created',
        payload: JSON.stringify({ user: owner.name, cardTitle: cardLogin.title }),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        boardId: board.id,
        cardId: cardBudget.id,
        userId: member.id,
        type: 'comment_added',
        payload: JSON.stringify({ user: member.name, cardTitle: cardBudget.title }),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Seed complete! All demo data created/verified successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
