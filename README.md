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

Workaholic uses **PostgreSQL**. You can run PostgreSQL locally via Docker Compose or use any cloud PostgreSQL URL (Neon, Supabase, Render, etc.):

```bash
# Option A: Start local PostgreSQL using Docker Compose
docker compose up -d

# Option B: Or set your DATABASE_URL in .env
# e.g.: DATABASE_URL="postgresql://workaholic:workaholic_dev_password@localhost:5432/workaholic?schema=public"

# Deploy migrations to PostgreSQL
npm run db:migrate

# Seed default template, demo users, sample board, lists, and cards (idempotent)
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

The test suite contains automated integration tests covering authentication, board CRUD, lists and cards, card details, and security/RBAC enforcement:

```bash
# Run all tests across server and shared workspaces
npm test
```

---

## 📦 Production Build

```bash
npm run build
```
Builds the shared TypeScript library, compiles the Express backend, and builds the optimized production Vite bundle for the client.

---

## 🌐 Deployment Guide (Render & PostgreSQL)

Workaholic is configured for production deployments on **Render** with persistent managed PostgreSQL. Full step-by-step instructions and blueprint details are in [DEPLOY.md](DEPLOY.md).

### Quick Render Deployment:
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), choose **Blueprints** $\rightarrow$ **New Blueprint Instance**.
3. Select this repository. Render automatically reads `render.yaml` to provision:
   * **PostgreSQL Database** (`workaholic-db`)
   * **Web Service** (`workaholic-web`) with automatic migration deployment (`prisma migrate deploy`).
4. Set your environment variables:
   * `JWT_SECRET`: (Auto-generated by Render Blueprint or enter a random 32+ character string)
   * `CLIENT_URL`: Your production web app URL
   * `GEMINI_API_KEY`: Your Gemini API key for AI summaries
5. Click **Apply**. All data will persist permanently across restarts and deployments.
