#!/usr/bin/env node
/**
 * Persistence & Restart Verification Test
 *
 * Verifies that:
 * 1. A user can register and create a board.
 * 2. The server process can be completely killed and restarted.
 * 3. The user can log back in and their boards/cards persist in PostgreSQL.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = 4055;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Waiting for server to accept connections
    }
    await wait(500);
  }
  throw new Error(`Server at ${BASE_URL} failed to become healthy within timeout.`);
}

function startServer() {
  const child = spawn('node', ['server/dist/server.js'], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'development',
    },
    stdio: 'inherit',
  });
  return child;
}

async function run() {
  console.log('🧪 Starting Persistence Verification across Server Restarts...');
  const timestamp = Date.now();
  const testUser = {
    name: `Persist User ${timestamp}`,
    email: `persist_${timestamp}@workaholic.test`,
    password: 'Password123!',
  };
  const boardTitle = `Persistent Board ${timestamp}`;

  // Step 1: Start Server Instance 1
  console.log('\n▶ [1/4] Starting Server Instance #1...');
  let serverProcess = startServer();
  const health1 = await waitForServer();
  console.log('  Instance #1 is healthy:', health1);

  // Step 2: Register user and create board
  console.log('\n▶ [2/4] Registering User and Creating Board...');
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });

  if (!regRes.ok) {
    const err = await regRes.text();
    serverProcess.kill('SIGTERM');
    throw new Error(`Registration failed: ${regRes.status} ${err}`);
  }

  const rawCookies = regRes.headers.get('set-cookie') || '';
  const tokenCookie = rawCookies.split(';')[0];
  console.log('  Registered user successfully:', testUser.email);

  const createBoardRes = await fetch(`${BASE_URL}/api/boards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: tokenCookie,
    },
    body: JSON.stringify({
      title: boardTitle,
      background: 'peach',
      templateId: 'blank',
    }),
  });

  if (!createBoardRes.ok) {
    const err = await createBoardRes.text();
    serverProcess.kill('SIGTERM');
    throw new Error(`Board creation failed: ${createBoardRes.status} ${err}`);
  }

  const createdBoard = await createBoardRes.json();
  const boardId = createdBoard.data?.board?.id || createdBoard.board?.id || createdBoard.id;
  console.log(`  Board created successfully: "${boardTitle}" (ID: ${boardId})`);

  // Step 3: Simulate Hard Server Restart
  console.log('\n▶ [3/4] SIMULATING SERVER RESTART (Terminating Instance #1)...');
  serverProcess.kill('SIGTERM');
  await wait(1000);

  console.log('  Instance #1 stopped. Launching new Server Instance #2...');
  serverProcess = startServer();
  const health2 = await waitForServer();
  console.log('  Instance #2 is online and healthy:', health2);

  // Step 4: Verify persistence after restart
  console.log('\n▶ [4/4] Verifying User Login and Board Persistence on Instance #2...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.text();
    serverProcess.kill('SIGTERM');
    throw new Error(`Login after restart failed: ${loginRes.status} ${err}`);
  }

  const newCookies = loginRes.headers.get('set-cookie') || '';
  const newTokenCookie = newCookies.split(';')[0] || tokenCookie;
  console.log('  Login after restart succeeded! User authenticated.');

  const listBoardsRes = await fetch(`${BASE_URL}/api/boards`, {
    method: 'GET',
    headers: { Cookie: newTokenCookie },
  });

  if (!listBoardsRes.ok) {
    const err = await listBoardsRes.text();
    serverProcess.kill('SIGTERM');
    throw new Error(`Listing boards after restart failed: ${listBoardsRes.status} ${err}`);
  }

  const boardsData = await listBoardsRes.json();
  const boardsList = boardsData.data?.boards || boardsData.boards || boardsData;
  const foundBoard = boardsList.find((b) => b.title === boardTitle);

  if (!foundBoard) {
    serverProcess.kill('SIGTERM');
    throw new Error(`FAILURE: Board "${boardTitle}" was NOT found after server restart!`);
  }

  console.log(`  FOUND BOARD: "${foundBoard.title}" (ID: ${foundBoard.id})!`);
  console.log('\n🎉 SUCCESS: Data persisted across server process termination and restart!');

  serverProcess.kill('SIGTERM');
}

run().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
