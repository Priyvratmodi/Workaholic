# Workaholic: A Project Management Tool

> **This file is the source of truth for the project.** Read it fully before planning or writing code. If something here conflicts with your assumptions, this file wins. If something is missing, ask or note the assumption in the Plan; do not silently invent behavior.

---

## 1. Overview

**Workaholic** is a Trello-style project management web app. Users organize work into **boards → lists → cards**, move cards with smooth drag-and-drop, and collaborate with **role-based access** (owner / member / viewer).

**Product goals**

- Feel instant and smooth: optimistic updates, short animations, no layout jank.
- Look modern and match the Stitch designs in `/design` exactly.
- Be secure: every permission is enforced on the server, never only in the UI.
- New boards start from a useful default template ("Project Management") so users learn the workflow immediately.

**Out of scope for v1:** billing, native mobile apps, third-party integrations, automations/Butler-style rules, AI features (see Section 15 for the future-ready note).

---

## 2. Design source of truth: the `/design` folder

The project contains a `/design` folder with the Stitch-generated designs for every board screen. **These designs define the UI.** Do not invent a different visual style.

### Rules for working with `/design`

1. **Before planning any UI**, list and open every file in `/design` (HTML, images, screenshots, or exports). Do this first.
2. **Build a Screen Map** in the Plan: a table mapping each design file to the screen or component it represents, e.g.

   | Design file | Screen / component | Route or location |
   |---|---|---|
   | _(fill from /design)_ | _(e.g. Board view)_ | _(e.g. /boards/:id)_ |

3. **Extract design tokens** from the designs (colors, font sizes, spacing, radii, shadows) into a single source: `client/src/styles/tokens.css` and the Tailwind config. Components must use tokens, never hard-coded hex values.
4. **If a design file is HTML/Tailwind**, reuse its structure and class choices as the starting point for the React component, then make it dynamic. Do not paste raw HTML; convert it into typed components.
5. **If a screen is described in this spec but missing from `/design`**, build it using the same tokens and components, and flag it in the Plan as "no design provided".
6. **If a design conflicts with this spec's behavior** (for example, a button shown that a viewer should not see), the design wins on appearance and this spec wins on behavior and permissions.
7. **Do not modify files in `/design`.** Treat the folder as read-only.
8. For every milestone, compare the running app against the matching design and attach a side-by-side screenshot as proof.

### Fallback tokens (use only if `/design` does not define them)

| Token | Value |
|---|---|
| Page background | `#1D2125` |
| List background | `#22272B` |
| Card background | `#2C333A` |
| Card hover | `#333B44` |
| Border | `#38414A` |
| Body text | `#B6C2CF` |
| Headings | `#FFFFFF` |
| Primary accent | `#579DFF` |
| Font | Inter |
| Radius | 8px (cards, inputs), 12px (lists, modals) |
| Spacing grid | 8px |
| List width | 272px |

---

## 3. Tech stack

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS
- `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop
- TanStack Query for server state; Zustand for UI state
- React Router
- `lucide-react` icons, Inter font

**Backend**
- Node.js + Express + TypeScript
- Prisma ORM with PostgreSQL (SQLite acceptable for local dev only)
- Zod for request validation
- JWT in httpOnly cookies; bcrypt for password hashing
- `fractional-indexing` package for ordering

**Repo layout**

```
workaholic/
├── design/            # Stitch designs (read-only, provided by me)
├── client/            # React app
├── server/            # Express API + Prisma
├── shared/            # Permission map, shared types, template definitions
├── SPEC.md            # This file
├── README.md          # Setup + scripts
└── .env.example
```

- A root `npm run dev` must start client and server together.
- Strict TypeScript everywhere. No `any`. ESLint + Prettier configured.
- No secrets in the client. Provide `.env.example`.

---

## 4. Core concepts

**User → Board → List → Card.** A **membership** links a user to a board with a role.

- **Board:** a project workspace.
- **List:** a column on a board.
- **Card:** a task inside a list.
- **Membership:** `owner`, `member`, or `viewer`.

---

## 5. Features

### 5.1 Authentication
- Register, login, logout, and `GET /auth/me`.
- Passwords hashed with bcrypt. Session in an httpOnly, SameSite cookie.
- Unauthenticated users are redirected to login; authenticated users skip it.

### 5.2 Boards dashboard
- Sections: **Starred boards** and **Your boards**, shown as tiles.
- Each tile shows the title, member avatars, and a **role badge** (Owner / Member / Viewer).
- A "+ Create new board" tile opens the Create board modal (Section 8).
- Starring is per user.

### 5.3 Board page
- Horizontally scrolling lists; each list scrolls its cards vertically.
- Top bar: logo, board title (inline-editable for owners/members) with star, Share button, overlapping member avatars, search, notifications, user avatar, role badge.
- "+ Add another list" column at the far right.

### 5.4 Lists
- Create, rename inline (click the title), reorder by dragging, archive/delete.
- Header shows the title (with emoji), a card count, and a three-dot menu.
- "+ Add a card" at the bottom of each list.

### 5.5 Cards
- Create inline: Enter saves, Esc cancels.
- Edit, delete, and mark complete (green check circle on the card and in the modal).
- Card face shows: label strips, title, and a meta row (due-date chip, comment count, attachment count, checklist progress like `2/4`, member avatars).
- **Due-date chip states:** overdue = red, due soon (within 24h) = amber, complete = green, otherwise neutral.

### 5.6 Card detail modal
Two-column modal, matching the design in `/design`.

- **Top bar:** current-list chip (click to open a "move to list" dropdown), cover image icon, more (`...`) menu, close (X).
- **Left column:**
  - Title with the green check circle (editable).
  - Action buttons: **+ Add**, **Labels**, **Dates**, **Checklist**, **Attachment**.
  - **Members** section with avatars and a "+" button.
  - **Description** with a bordered textarea (placeholder: "Add a more detailed description...").
  - Checklists with a progress bar, and attachments when present.
- **Right column:**
  - "Comments and activity" header with a **Show details** toggle (off = comments only; on = comments plus activity).
  - "Write a comment..." input.
  - Feed entries: avatar, bold name, action text, and a blue relative timestamp (for example "2 hours ago").
- Opening a card updates the URL (`/boards/:id/cards/:cardId`) so it can be linked and refreshed.

### 5.7 Drag and drop
- Move cards **within a list**, **across lists**, and **into empty lists** (empty lists must have a visible drop zone).
- Reorder **lists** horizontally.
- Use `DragOverlay`: the dragged card is rotated about 3° with a larger shadow.
- Show a **dashed placeholder** at the drop position; other cards shift out of the way.
- Support pointer, touch (long-press), and keyboard sensors.
- Auto-scroll when dragging near the edges of the board or a list.

### 5.8 Optimistic updates
- Update the UI instantly on drop and send `PATCH` in the background.
- On failure: roll back to the previous state and show an error toast.
- Avoid flicker: do not refetch the whole board after a successful move; reconcile quietly.

### 5.9 Ordering (fractional indexing)
- `position` is a fractional-index string/number so **moving a card updates exactly one row**.
- Compute the new position from the neighbors above and below the drop point.
- If gaps get too small, rebalance that list in a single transaction.
- Unit tests required (Section 12).

### 5.10 Labels, dates, checklists, comments, activity
- **Labels:** color plus optional name, defined per board, many-to-many with cards.
- **Dates:** optional start date and due date, with a date picker.
- **Checklists:** multiple per card, items with checkboxes, and a progress bar.
- **Comments:** create, edit own, delete own (owners can delete any).
- **Activity log:** written on card create, move, complete, member add/remove, label change, date change, and comment. Stored as `type` + JSON `payload`, rendered into readable sentences by the client.

### 5.11 Search and shortcuts
- Search in the top bar filters cards on the current board by title, description, and label.
- `N` opens the add-card input in the focused list. `Esc` closes modals and cancels inputs.

---

## 6. Role-based access (owner / member / viewer)

### 6.1 Permission matrix

| Action | Owner | Member | Viewer |
|---|:---:|:---:|:---:|
| View board, lists, cards, comments, activity | ✅ | ✅ | ✅ |
| Create / edit / move / delete cards | ✅ | ✅ | ❌ |
| Create / rename / reorder / archive lists | ✅ | ✅ | ❌ |
| Add comments, labels, checklists, dates | ✅ | ✅ | ❌ |
| Rename board, change background | ✅ | ✅ | ❌ |
| Invite / remove members, change roles | ✅ | ❌ | ❌ |
| Delete board | ✅ | ❌ | ❌ |

### 6.2 One shared permission map
Define permissions **once** in `shared/permissions.ts` and import it on both client and server.

```ts
export const PERMISSIONS = {
  owner:  ['view', 'edit', 'comment', 'manageMembers', 'deleteBoard'],
  member: ['view', 'edit', 'comment'],
  viewer: ['view'],
} as const;
```

### 6.3 Server enforcement (the real security)
- A middleware loads the user's role from `board_members` for the board that the requested resource belongs to (resolve board from list/card IDs as needed) and returns **403** when the action is not allowed. Return **404** (not 403) if the user is not a member at all, so board existence is not leaked.
- **Every write endpoint** goes through this middleware. No exceptions.
- A role change takes effect on the user's next request (no caching of roles beyond the request).

### 6.4 Client enforcement (the experience)
- A `useBoardPermissions()` hook exposes `can('edit')`, etc., from the shared map.
- **Viewer experience:** a "You have view-only access" banner, a gray "Viewer" badge, dragging disabled (no drag handles or cursor changes), no add/edit/delete buttons, read-only title and description, and no comment box.
- Never leave a button visible that would fail when clicked.

### 6.5 Rules and edge cases
- A board **must always have at least one owner**. Block demoting or removing the last owner (server and UI).
- The board creator becomes the first owner.
- Owners can transfer ownership by promoting another member to owner.

### 6.6 Share modal (owner only)
- Email input with a role dropdown (Member / Viewer) and an **Invite** button.
- Member list: avatar, name, email, role dropdown. The last-owner row is locked.
- Red **Remove** action per member.
- "Copy invite link" option and short helper text explaining each role.
- For v1, invites for emails without an account create a pending invitation that is claimed on registration.

---

## 7. Default template: "Project Management"

**Template name:** Project Management
**Tagline:** Manage Projects To Perfection
**Description:** Big dreams turn into bigger results with a killer project plan. Use this basic structure to build your team's ideal workflow, for projects big or small.

### 7.1 Lists (exact order)

Each list is created with its emoji in the title and one starter card whose description explains the list.

| # | List title | Emoji | Starter card title |
|---|---|:---:|---|
| 1 | Resources (Start Here!) | 📚 | How to use this list |
| 2 | Questions For Next Meeting | 🌊 | How to use this list |
| 3 | To Do | 🔮 | How to use this list |
| 4 | Pending | 💬 | How to use this list |
| 5 | Blocked | 🚷 | How to use this list |
| 6 | Done | ✨ | How to use this list |

### 7.2 Starter card descriptions (use verbatim)

1. **Resources (Start Here!)** 📚
   > This list is perfect for you and your team to have all those documents, specs, designs, or anything you tend to reference all the time. Meeting schedules and answers to common questions are also recommended to pop into this list so that your team is informed at all times. 📚

2. **Questions For Next Meeting** 🌊
   > Never again forget that important question you thought of in the shower this morning! Slide your Q's into this handy list so your team keeps on flowing. 🌊

3. **To Do** 🔮
   > The mother of all lists—the good ol' To Do. This is where assigned tasks live so that your team can see who's working on what and when it's due. Crystal clear all day, week, and month. 🔮

4. **Pending** 💬
   > We all have those in-between tasks that are technically done but also awkwardly waiting for another step. That's where the Pending list comes into play, use this list to share what those next mini-steps are with your team. 💬

5. **Blocked** 🚷
   > With any successful project comes at least one inevitable blocker. Splash those red-tape, blocking issues that are slowing your team down so you can tackle it in the best way; together. 🚷

6. **Done** ✨
   > Our favorite list, the Done list. Stop, drag, and drop! For all your finished tasks that your team has hustled on and feels proud of. ✨

### 7.3 Implementation requirements
- Define the template as **data** in `shared/templates.ts` (typed config object), then seed it into a `Template` table. Adding a new template must not require changing creation logic.
- `createBoardFromTemplate(userId, title, templateId)` runs in **one database transaction**: board → owner membership → lists (positions via fractional indexing) → starter cards → default labels → activity entry ("{user} created this board"). A failure rolls everything back.
- "Create board" defaults to this template, with a **Blank board** option beside it.

---

## 8. Create board modal ("About this template")

- Centered modal, two columns, matching `/design`.
- **Left:** template options. "Project Management" is selected by default and tagged **Default**; "Blank board" below it.
- **Right:** a mini preview of the 6 lists (Resources, Questions, To Do, Pending, Blocked, Done), then:
  - Heading: **About this template**
  - Subheading: **Manage Projects To Perfection**
  - The template description paragraph (Section 7).
  - A numbered **What's included** list with each list's emoji, name, and one-line explanation.
  - A **Board title** input (placeholder "Project Management"), a **Visibility** dropdown, and a full-width **Create board** button.
- After creation, navigate straight to the new board.

---

## 9. Data model (Prisma)

Models: `User`, `Board`, `BoardMember`, `BoardStar`, `List`, `Card`, `CardMember`, `Label`, `CardLabel`, `Checklist`, `ChecklistItem`, `Attachment`, `Comment`, `Activity`, `Template`, `Invitation`.

Key fields:

```
User            id, name, email (unique), passwordHash, avatarUrl, createdAt
Board           id, title, background, createdAt, updatedAt
BoardMember     boardId, userId, role ('owner'|'member'|'viewer')   -- unique (boardId, userId)
BoardStar       boardId, userId
List            id, boardId, title, emoji, position, isArchived
Card            id, listId, title, description, startDate, dueDate, position, isComplete, createdAt
CardMember      cardId, userId
Label           id, boardId, name?, color
CardLabel       cardId, labelId
Checklist       id, cardId, title, position
ChecklistItem   id, checklistId, text, isDone, position
Attachment      id, cardId, name, url, createdAt
Comment         id, cardId, userId, body, createdAt, updatedAt
Activity        id, boardId, cardId?, userId, type, payload (JSON), createdAt
Template        id, name, tagline, description, structure (JSON), isDefault
Invitation      id, boardId, email, role, token, createdAt
```

- Indexes on all foreign keys and on `(listId, position)` and `(boardId, position)`.
- Cascade deletes: deleting a board removes its lists, cards, and dependents.
- Seed script (Section 12) creates demo data.

---

## 10. API

REST, JSON, Zod validation, and a consistent error shape: `{ error: { code, message, details? } }`. Auth via cookie.

**Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`

**Boards**
- `GET /boards`: boards I belong to (with my role, star state, member avatars)
- `POST /boards` `{ title, templateId? }`: create from template or blank
- `GET /boards/:id`: **board + lists + cards + labels + members in one call**
- `PATCH /boards/:id`, `DELETE /boards/:id` (delete: owner only)
- `POST /boards/:id/star`, `DELETE /boards/:id/star`

**Lists:** `POST /boards/:id/lists`, `PATCH /lists/:id` (rename / reorder / archive), `DELETE /lists/:id`

**Cards:** `POST /lists/:id/cards`, `GET /cards/:id`, `PATCH /cards/:id` (edit or move: `listId` + `position`), `DELETE /cards/:id`

**Card extras:** `POST /cards/:id/comments`, `PATCH|DELETE /comments/:id`, `POST /cards/:id/checklists`, `POST|PATCH|DELETE /checklists/:id/items`, `POST|DELETE /cards/:id/labels`, `POST|DELETE /cards/:id/members`, `POST /cards/:id/attachments`

**Members:** `POST /boards/:id/members` (invite), `PATCH /boards/:id/members/:userId` (role), `DELETE /boards/:id/members/:userId`

**Other:** `GET /templates`, `GET /boards/:id/activity`

---

## 11. UX and quality requirements

- **Motion:** transitions 150-200ms on hover, drag lift, and modal open. Nothing slower.
- **Loading:** skeleton loaders for the dashboard, board, and modal.
- **Errors:** toasts for failed actions; inline validation on forms.
- **Empty states:** friendly prompts for empty boards, lists, and search results.
- **Accessibility:** visible focus rings, ARIA labels, keyboard-operable drag-and-drop, sufficient contrast, and respect for `prefers-reduced-motion`.
- **Responsive:** on mobile, lists snap horizontally (one list plus a peek of the next), the card modal becomes full-screen, and a floating "+" adds a card.
- **Performance:** memoize list and card components; avoid re-rendering the whole board on every drag-over event.
- **Dark mode is the default.** A light-mode toggle is optional if time allows.

---

## 12. Testing and seed data

**Seed script** creates:
- 3 demo users: `owner@workaholic.test`, `member@workaholic.test`, `viewer@workaholic.test` (documented password in the README, dev only).
- One sample board built from the default template, with all three users as members using their matching roles, plus a few extra realistic cards (due dates, labels, a checklist, comments).

**Required tests**
- Unit: the permission map (every role × action).
- Unit: fractional positioning (insert first, last, between, repeated inserts, rebalance).
- Integration: a **viewer receives 403 on every write endpoint**; a non-member receives 404; a member cannot manage members or delete the board; the last owner cannot be removed or demoted.
- Integration: `createBoardFromTemplate` produces 6 lists in the correct order with starter cards, and rolls back fully when any step fails.

---

## 13. Milestones

Produce a **Plan** (folder structure, Screen Map from `/design`, data model, API list, milestones) and **wait for my approval** before coding.

1. **Foundation:** monorepo, Prisma schema + migration, auth, shared permission map, seed script, auth tests.
2. **Boards and template:** boards CRUD, template system, `createBoardFromTemplate`, dashboard, Create board modal with "About this template".
3. **Board, lists, cards, drag-and-drop:** board page, inline add/rename, dnd-kit with fractional positions, `DragOverlay`, placeholder, empty-list drop zones, optimistic updates with rollback.
4. **Card modal:** labels, dates, checklists, members, comments, activity with the Show details toggle, deep-linkable URL.
5. **Roles:** server middleware on every write route, client gating, viewer banner and badge, Share modal, 403/404 integration tests.
6. **Polish:** animations, skeletons, toasts, keyboard shortcuts, search, mobile layout, accessibility pass, README.

After each milestone: run the app, test it in the browser, and attach a screenshot or recording comparing it to the matching file in `/design`.

---

## 14. Acceptance criteria

Verify each in the browser before declaring the project done.

1. Registering and creating a board from the default template produces **6 lists in the exact order in Section 7**, each with its starter card and verbatim description.
2. A card can be dragged within a list, to another list, and into an **empty** list; the new order **persists after refresh**.
3. A failed move request **rolls the card back** and shows a toast.
4. A move updates **one card row** (verify in the network tab or logs).
5. As the **viewer**: cannot drag, edit, comment, or see add buttons; direct API writes return **403**.
6. As the **owner**: can invite a member, change roles, and cannot remove or demote the last owner.
7. The card modal matches `/design` and includes the **Show details** toggle and the clickable list chip.
8. The dashboard, board, Create board modal, Share modal, and card modal each visually match their file in `/design`.
9. No console errors; lint, type-check, and all tests pass; `npm run dev` starts everything from a clean clone using the README.

---

## 15. Future-ready notes (do not build in v1)

- **AI board summary:** a "Summarize board" action would send the board's lists and cards to an LLM from the server (API key never in the client), show the result in a side panel, and cache it. The current schema needs no changes to support this.
- Realtime sync (WebSockets), due-date reminders, templates marketplace, file uploads to object storage, and a light theme.

---

## 16. Working rules for the AI agent

- Plan first, then wait for approval. Work milestone by milestone.
- Keep changes small and commit logically. Do not rewrite unrelated files.
- Never trust the client for permissions. Never put secrets in client code.
- Use only the tokens and components defined from `/design`; do not hard-code colors.
- Prefer boring, well-documented libraries over clever custom code.
- When a requirement is ambiguous, state your assumption in the Plan instead of guessing silently.
- Keep `README.md` current: setup, env vars, scripts, test commands, demo logins.
