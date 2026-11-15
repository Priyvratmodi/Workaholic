# Workaholic 🚀

**Workaholic** is a full-stack modern Trello-style project management web application built to mirror the Stitch designs and specifications. It delivers instant optimistic drag-and-drop kanban boards, strict role-based access control, deep-linked card modals, and a seeded "Project Management" template.

---

## 📸 Key Features & Architecture

### 1. Robust Monorepo Structure
- **`shared/` (`@workaholic/shared`)**: Shared TypeScript interfaces, Zod schemas, role permissions, fractional indexing calculations, and default template definitions.
- **`server/`**: Express API with Prisma ORM, SQLite (`dev.db`), HttpOnly JWT cookie auth, and server-side RBAC middleware.
- **`client/`**: React 18 SPA built with Vite, Tailwind CSS, `@dnd-kit` drag-and-drop, TanStack Query, and Zustand.

### 2. Role-Based Access Control (RBAC) & Security
- **Three Roles**:
  - `owner`: Full administrative and editing rights. Can invite members, change roles, delete boards.
  - `member`: Can create, edit, move, and delete cards and lists; add comments, checklists, labels, and attachments.
  - `viewer`: Strictly read-only access.
- **Server Enforcement**:
  - Disallowed write attempts return **403 Forbidden**.
  - Non-members accessing any board resource receive **404 Not Found** (not 403), ensuring zero information leakage regarding board existence.
  - **Last-Owner Guard**: Demoting or removing the last remaining owner of a board is strictly blocked with `400 Bad Request` (`LAST_OWNER_PROTECTED`).

### 3. Instant Optimistic Drag-and-Drop
- Powered by `@dnd-kit/core` and `@dnd-kit/sortable`.
- Card drag visual feedback: 3° tilt, shadow lift, and dashed placeholder.
- Supports cross-list movements and empty list drop zones.
- **Fractional Indexing**: Moving a card between lists or reordering within a list updates **exactly one card row** (`{ listId, position }`) in the database.

### 4. Seeded "Project Management" Default Template
- Creating a board defaults to the "Project Management" template.
- Pre-seeds 6 lists in verbatim order with starter cards:
  1. `Resources (Start Here!)` (📚)
  2. `Questions For Next Meeting` (🌊)
  3. `To Do` (🔮)
  4. `Pending` (💬)
  5. `Blocked` (🚷)
  6. `Done` (✨)

### 5. Two-Column Card Detail Modal
- Deep-linked route: `/boards/:id/cards/:cardId`.
- Left column:
  - Editable title & description.
  - Due date chip with color-coded status badges (amber for due soon, red for overdue, green for completed).
  - Multiple checklists with percentage progress bars.
  - File attachments with direct links and deletion.
- Right column:
  - Action shortcuts (assign members, labels, dates, cover color).
  - Activity & Comments stream with a **Show details / Hide details** toggle to filter between user comments and system events.

### 6. Share Board Modal
- Owner-only modal matching Stitch designs.
- Invites members by email with role selection (`member` or `viewer`).
- Manage existing member roles with live last-owner protection.
- One-click copy board link with instant feedback toast.

---

## 🔑 Demo Accounts

The database comes pre-seeded with three demo accounts for quick testing:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Owner** | `owner@workaholic.test` | `password123` |
| **Member** | `member@workaholic.test` | `password123` |
| **Viewer** | `viewer@workaholic.test` | `password123` |

*One-click demo login buttons are provided directly on the login page for convenience.*

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 18 (Tested on Node.js v24)
- npm >= 9

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Seed Demo Data
```bash
# Push database schema to SQLite
npm run db:push

# Seed default templates, users, sample boards, lists, and cards
npm run seed
```

### 3. Start Development Servers
```bash
npm run dev
```
- Client runs at: `http://localhost:5173`
- Backend API runs at: `http://localhost:4000`

---

## 🧪 Running Tests

The test suite contains 48 automated integration tests covering authentication, board CRUD, lists and cards, card details, and security/RBAC enforcement:

```bash
# Run all tests across server and shared workspaces
npm test
```

### Test Coverage Highlights:
- `server/tests/auth.test.ts`: Registration, login, validation, cookies, logout (9 tests).
- `server/tests/boards.test.ts`: Board CRUD, templates, star/unstar, activity logs (9 tests).
- `server/tests/lists-cards.test.ts`: List CRUD, card creation, card movement with fractional indexing (7 tests).
- `server/tests/card-details.test.ts`: Checklists, items, comments, attachments, labels, member assignments (6 tests).
- `server/tests/security-roles.test.ts`: 404 existence protection, 403 viewer write blocks, last-owner demotion/removal protection (6 tests).
- `shared/tests/permissions.test.ts`: Permission matrix assertions (4 tests).
- `shared/tests/position.test.ts`: Fractional indexing calculations and rebalancing checks (7 tests).

---

## 📦 Production Build

```bash
npm run build
```
Builds the shared TypeScript library, compiles the Express backend, and builds the optimized production Vite bundle for the client.

---

## 🌐 Deployment Guide

### Option 1: All-in-One Docker Deployment (Recommended — Render / Railway / Fly.io)
Because Workaholic includes an optimized multi-stage `Dockerfile` that packages both the Vite React frontend and the Express backend into a single container:

1. **Push your repository** to GitHub or GitLab.
2. **On Render / Railway**:
   - Create a **New Web Service** and connect your GitHub repo.
   - Choose **Docker** as the runtime (Render will automatically detect the root `Dockerfile`).
   - Add Environment Variables:
     - `PORT`: `4000`
     - `DATABASE_URL`: `file:./dev.db`
     - `JWT_SECRET`: `<generate-a-random-secure-string>`
     - `GEMINI_API_KEY`: `<your-gemini-api-key>`
     - `NODE_ENV`: `production`
   - Click **Deploy**. Your entire application (API, frontend, and SQLite database) will be live with a free HTTPS URL.

---

### Option 2: Split Deployment (Vercel Frontend + Render/Railway Backend)
If you prefer hosting the client on **Vercel**:

#### 1. Backend (Render / Railway):
- Deploy the repository as a Node/Docker Web Service.
- Set environment variables:
  - `PORT`: `4000`
  - `DATABASE_URL`: `file:./dev.db`
  - `JWT_SECRET`: `<random-secret>`
  - `CLIENT_URL`: `https://your-app.vercel.app`
  - `COOKIE_SAME_SITE`: `none`
  - `GEMINI_API_KEY`: `<your-gemini-api-key>`

#### 2. Frontend (Vercel):
- In the Vercel Dashboard, click **Add New Project** and import this repository.
- Configure project settings:
  - **Framework Preset**: `Vite`
  - **Root Directory**: `client`
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
- Add Environment Variable:
  - `VITE_API_URL`: `https://your-backend-service.onrender.com`
- Click **Deploy**.
