<p align="center">
  <img src="assets/logo.svg" width="112" height="112" alt="Workaholic Logo" />
</p>

<h1 align="center">Workaholic</h1>

<p align="center">
  <strong>Modern, Full-Stack Project Management & Sprint Orchestration Platform</strong>
</p>

<p align="center">
  <a href="#-key-features"><img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=flat-square" alt="Status" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react" alt="React" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Express-4.19-lightgrey?style=flat-square&logo=express" alt="Express" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/PostgreSQL-Prisma-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Gemini_AI-Flash-orange?style=flat-square&logo=google" alt="Gemini AI" /></a>
  <a href="#-deployment"><img src="https://img.shields.io/badge/Deploy-Render%20%2B%20Docker-46E3B7?style=flat-square&logo=render" alt="Render" /></a>
</p>

---

## 📖 Overview

**Workaholic** is a high-performance, full-stack collaborative project management platform built to orchestrate sprints, team initiatives, and complex deliverables with fluid responsiveness and zero layout jank.

Engineered as an **npm monorepo**, Workaholic pairs contract-first TypeScript definitions with optimistic UI mutations, lexicographical fractional indexing for drag-and-drop operations, rigorous server-side role-based access control (RBAC), and automated Generative AI sprint diagnostics powered by Google Gemini.

---

## ⚡ Key Architectural Features

### 1. $O(1)$ Fractional Indexing Drag-and-Drop
- Powered by `@dnd-kit/core` and `@dnd-kit/sortable` with custom 3° tilt physics and drop shadows.
- Eliminates sequential integer position cascades: reordering or moving a card between lists computes a lexicographical midpoint string (`a0`, `a0V`, `a1`), executing strictly as a **single-row $O(1)$ database update**.
- Fully optimistic client updates with automated rollback on network failure.

### 2. Multi-Tier Role-Based Access Control (RBAC)
- **Granular Roles**:
  - `owner`: Full workspace authority, member invitation, role promotion/demotion, and board deletion.
  - `member`: Create, edit, reorder, comment, and attach files to cards and lists.
  - `viewer`: Strictly read-only access with clean disabled state indicators.
- **Last-Owner Protection**: Prevents boards from becoming orphaned by forbidding the final owner from demoting or removing themselves (`LAST_OWNER_PROTECTED`).
- **Zero Information Leakage**: Non-members attempting to access private boards receive a `404 Not Found` rather than `403 Forbidden`.

### 3. Native Generative AI Board Diagnostics
- Instant sprint health evaluations powered by Google's **Gemini 1.5 Flash** API.
- Analyzes active swimlanes, overdue due dates, unassigned tickets, and blocked tags to deliver:
  - Overall sprint situation assessment (Healthy, At Risk, Critical).
  - Prioritized blockers and bottleneck detection.
  - Actionable, context-aware remediation recommendations.
- Features a secure **Bring-Your-Own-Key (BYOK)** drawer for seamless client-side key overrides.

### 4. Comprehensive Task Workspace
- Deep-linked modal routing (`/boards/:id/cards/:cardId`) enabling instant sharing of individual cards.
- Interactive checklists with live animated progress bars.
- Multipart file attachments with direct download previews and deletion.
- Color-coded labels and priority tags.
- Detailed audit activity stream with a toggle to filter between user comments and automated system events.

### 5. Production Persistence & Reliability
- Powered by **PostgreSQL** with Prisma ORM (migrated from local development SQLite).
- Deterministic automated schema migrations on startup (`npx prisma migrate deploy`).
- Multi-stage Docker containerization ready for one-click deployment on **Render**.
- Stateless session management using `httpOnly`, `Secure` JWT cookies with reverse-proxy trust headers enabled.

---

## 🏗️ Monorepo Architecture

```
Workaholic/
├── assets/                  # Brand vectors and project assets (logo.svg)
├── shared/                  # @workaholic/shared
│   └── src/
│       ├── types.ts         # Contract-first TypeScript domain models
│       ├── schemas.ts       # Zod validation schemas
│       ├── permissions.ts   # Unified RBAC permission matrix
│       ├── fractionalIndex.ts# Lexicographical O(1) positioning engine
│       └── templates.ts     # Seed template definitions (Project Management)
├── server/                  # Node.js + Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma    # PostgreSQL database schema & relations
│   │   └── migrations/      # Version-controlled SQL migration history
│   └── src/
│       ├── controllers/     # Board, card, list, AI, and auth controllers
│       ├── middleware/      # Auth guard, RBAC middleware, error handler
│       └── routes/          # REST API route handlers
└── client/                  # React 18 + Vite + Tailwind CSS SPA
    ├── public/              # Static assets and favicon
    └── src/
        ├── api/             # Typed API client services
        ├── components/      # UI components (Kanban canvas, modals, drawers)
        ├── stores/          # Zustand state stores (auth, theme)
        └── utils/           # Backgrounds, date formatters, drag helpers
```

---

## 🔑 Pre-Seeded Demo Accounts

For instant evaluation, the database includes three pre-configured accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner@workaholic.test` | `password123` | Full admin, member management, board deletion |
| **Member** | `member@workaholic.test` | `password123` | Create, edit, move, comment, attachments |
| **Viewer** | `viewer@workaholic.test` | `password123` | Read-only board and card inspection |

*Quick-login shortcut buttons are integrated directly into the login screen.*

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** (optional, for running local PostgreSQL)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Priyvratmodi/Workaholic.git
cd Workaholic
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or use `.env.example`):
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
DATABASE_URL=postgresql://workaholic:workaholic_dev_password@localhost:5432/workaholic?schema=public
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Initialize Database & Seed
```bash
# Start local PostgreSQL via Docker Compose
docker compose up -d

# Deploy migrations to the database
npm run db:migrate

# Seed demo users, default templates, starter boards, and cards
npm run seed
```

### 4. Start Development Servers
```bash
npm run dev
```
- **Web Client**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:4000](http://localhost:4000)

---

## 🧪 Testing & Verification

The repository features comprehensive automated test suites covering unit logic, RBAC matrix enforcement, and design system compliance:

```bash
# Run all server and shared integration tests
npm test

# Run client-side Vitest suite (theme audit, icon regression, AST hex audit)
npm test -w client
```

---

## 🌐 Production Deployment (Render + PostgreSQL)

Workaholic is packaged with a multi-stage `Dockerfile` and declarative `render.yaml` Blueprint for zero-downtime deployment:

1. Connect your repository in the [Render Dashboard](https://dashboard.render.com/).
2. Select **Blueprints** $\rightarrow$ **New Blueprint Instance**.
3. Render automatically provisions:
   - **PostgreSQL Database** (`workaholic-db`) with persistent storage.
   - **Web Service** (`workaholic-web`) executing `npx prisma migrate deploy && node dist/index.js`.
4. Configure your environment secrets (`JWT_SECRET`, `CLIENT_URL`, `GEMINI_API_KEY`).
5. Complete details and troubleshooting steps can be found in [DEPLOY.md](DEPLOY.md).

---

## 🛠️ Tech Stack Matrix

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, `@dnd-kit`, TanStack Query, Zustand |
| **Backend** | Node.js, Express, Prisma ORM, Zod, JWT (`httpOnly` cookies), Multer |
| **Database** | PostgreSQL (Production & Local Docker) |
| **AI Engine** | Google Gemini 1.5 Flash API (`@google/genai`) |
| **DevOps** | Docker (Multi-stage build), Render Blueprints, GitHub Actions |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
