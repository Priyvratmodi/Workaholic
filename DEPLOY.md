# 🚀 Deploying Workaholic on Render

This guide walks you through deploying **Workaholic** to Render with persistent PostgreSQL storage so that users, boards, lists, and cards are never lost when the server restarts or sleeps.

---

## Method 1: Render Blueprint (Recommended — 1-Click Provisioning)

Workaholic includes a `render.yaml` Blueprint that automatically sets up both the **Docker Web Service** and the **PostgreSQL Database** in one go:

1. Push your repository to **GitHub** or **GitLab**.
2. Log into the [Render Dashboard](https://dashboard.render.com/).
3. Click **Blueprints** in the top navigation bar.
4. Click **New Blueprint Instance**.
5. Connect your `Priyvratmodi/Workaholic` repository.
6. Render will automatically parse `render.yaml` and show:
   * **Database:** `workaholic-db` (PostgreSQL)
   * **Web Service:** `workaholic-web` (Docker)
7. Under Environment Variables:
   * Enter your `GEMINI_API_KEY` (if you want AI summaries enabled).
   * Leave `JWT_SECRET` (Render will generate a secure one automatically).
   * Set `CLIENT_URL` to your app URL (or leave default if single-service).
8. Click **Apply**. Render will create the database, run the baseline migration (`prisma migrate deploy`), and launch your container.

---

## Method 2: Manual Setup on Render

If you prefer setting up the services manually in the dashboard:

### Step 1: Create a PostgreSQL Database on Render
1. In the Render Dashboard, click **New +** $\rightarrow$ **PostgreSQL**.
2. Configure:
   * **Name:** `workaholic-db`
   * **Database:** `workaholic`
   * **User:** `workaholic`
   * **Region:** Choose the region closest to you (e.g. *Oregon* or *Frankfurt*).
   * **Instance Type:** *Free*
3. Click **Create Database**.
4. Wait ~30 seconds for status to change to **Available**.
5. Scroll down to **Connections**:
   * Copy the **Internal Database URL** (e.g. `postgresql://workaholic:...@dpg-...-a/workaholic`).
   * *(Note: If your web service is hosted on Render, always use the Internal URL for faster latency and zero egress fees).*

---

### Step 2: Create the Web Service
1. In the Render Dashboard, click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository: `Priyvratmodi/Workaholic`.
3. Configure the service:
   * **Name:** `workaholic-web`
   * **Region:** Same region as your database.
   * **Language / Environment:** **Docker** (Render will use the root `Dockerfile`).
   * **Instance Type:** *Free*
4. Add **Environment Variables**:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `<Paste Internal Database URL from Step 1>` | **Essential for persistence** |
| `JWT_SECRET` | `<32+ character random string>` | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | `production` | Enables production security guards |
| `PORT` | `4000` | Express server port |
| `COOKIE_SAME_SITE` | `lax` | Use `lax` if fullstack; use `none` if frontend on Vercel |
| `CLIENT_URL` | `https://your-service.onrender.com` | Or your Vercel URL if split |
| `GEMINI_API_KEY` | `<your-gemini-api-key>` | Optional for AI Board Summaries |

5. Click **Create Web Service**.

---

### Step 3: Verify Startup & Migrations

During startup, Render will execute:
```bash
npx prisma migrate deploy --schema=server/prisma/schema.prisma && node server/dist/server.js
```

You will see in the Render deploy logs:
```text
Prisma schema loaded from server/prisma/schema.prisma
Datasource "db": PostgreSQL database "workaholic"
1 migration found in prisma/migrations
Applying migration `20261116000000_init`
The following migration have been applied:
- 20261116000000_init
All migrations have been successfully applied.
🚀 Workaholic Server running on http://localhost:4000
```

---

## 🛡️ Persistence Verification

* When Render free tier spins down after inactivity or when you manually restart the service, **PostgreSQL preserves all records**.
* When the instance wakes up or restarts, users stay logged in (JWT secret is persistent) and all boards, lists, cards, comments, and attachments remain intact.
