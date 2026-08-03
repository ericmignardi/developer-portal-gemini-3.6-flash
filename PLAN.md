# PLAN — Atlas Build

Phased execution plan. Work phases **in order**. Do not begin a phase until the previous phase's exit criteria all pass.

**Rules of engagement**

- Tick each task with `[x]` as it completes.
- A phase is done only when every task under it is ticked **and** its exit criteria pass.
- Update the Progress Log at the bottom when closing a phase.
- If something in the PRD proves impossible or contradictory, note it in the Deviations section rather than silently improvising.

**Progress:** Phase 10 of 10 Completed

---

## Phase 0 — Foundation

- [x] Initialise Next.js with the App Router and TypeScript in strict mode
- [x] Install and configure TailwindCSS
- [x] Install Lucide React, Motion, Zod, Zustand, Prisma, `@prisma/client`
- [x] Create `docker-compose.yml` for PostgreSQL 16 with a named volume
- [x] Create `.env.example` and `.env` with `DATABASE_URL`
- [x] Configure ESLint and Prettier
- [x] Set up the base folder structure
- [x] Write the initial `README.md` with setup steps
- [x] Confirm `.gitignore` excludes `.env` and `node_modules`

**Exit criteria:** `docker compose up -d` starts Postgres; `npm run dev` serves a page with no console errors; `npx tsc --noEmit` is clean.

---

## Phase 1 — Data Layer

- [x] Write `prisma/schema.prisma` implementing all nine models from PRD §6
- [x] Define all enums: `ProjectStatus`, `Platform`, `EnvironmentType`, `TaskStatus`, `TaskPriority`, `ResourceType`, `LearningStatus`
- [x] Implement Tag many-to-many via **explicit join tables** across Project, Snippet, Resource, JournalEntry
- [x] Set cascade-delete behaviour on Project → Environments, and null-on-delete for optional project references
- [x] Add indexes on foreign keys and on frequently filtered columns (`status`, `dueDate`, `entryDate`)
- [x] Run the initial migration and commit it
- [x] Create a singleton Prisma client that survives dev hot-reload
- [x] Write Zod schemas for every entity — create and update variants
- [x] Write the seed script per PRD §7.11
- [x] Verify seeded data in Prisma Studio

**Exit criteria:** migration applies to a fresh database; seed runs idempotently; every relation is traversable in Studio.

---

## Phase 2 — App Shell & Design System

- [x] Define the colour palette, spacing scale, and typography in the Tailwind config
- [x] Build the root layout with a persistent sidebar
- [x] Sidebar navigation with icons, labels, and active-route indication
- [x] Collapsible sidebar with persisted state
- [x] Build shared primitives: Button, Input, Textarea, Select, Modal/Dialog, Badge, Card, Tooltip
- [x] Build shared state components: LoadingState, EmptyState, ErrorState
- [x] Build a reusable ConfirmDialog for destructive actions
- [x] Build a Toast/notification mechanism for mutation feedback
- [x] Add Motion page transitions
- [x] Create the Zustand store for UI and filter state

**Exit criteria:** every route renders inside the shell; primitives are reused, not re-declared per page; loading/empty/error components are usable from any list view.

---

## Phase 3 — Projects

- [x] `/api/projects` GET with `status`, `tag`, and `q` filters
- [x] `/api/projects` POST with Zod validation and slug generation
- [x] `/api/projects/[id]` GET, PATCH, DELETE
- [x] Project list page with cards
- [x] Status filter, tag filter, and search
- [x] Create-project form
- [x] Edit-project form
- [x] Delete with confirmation and cascade
- [x] Pin/unpin toggle
- [x] `/projects/[slug]` detail page with section or tab navigation
- [x] Overview section: description, repo and live links, tech stack, tags, dates
- [x] Loading, empty, and error states on both pages

**Exit criteria:** full project CRUD works; slugs are unique; deleting a project removes its environments; all filters compose correctly.

---

## Phase 4 — Environments

- [x] `/api/environments` GET filtered by `projectId`, and POST
- [x] `/api/environments/[id]` PATCH and DELETE
- [x] Environments section on the project detail page
- [x] Grouping or visual distinction by environment type
- [x] Platform badge or icon per environment
- [x] Create, edit, and delete forms
- [x] URL rendered as a link opening in a new tab
- [x] Copy-to-clipboard on URL with confirmation feedback
- [x] Environment count surfaced on project cards

**Exit criteria:** a project with production, preview, and development environments across Vercel, Neon, and local platforms displays clearly and is fully editable.

---

## Phase 5 — Tasks

- [x] `/api/tasks` GET with `projectId`, `status`, and `priority` filters, and POST
- [x] `/api/tasks/[id]` PATCH and DELETE, setting `completedAt` on transition to `DONE`
- [x] Board view grouped by status
- [x] List view
- [x] Persisted view-mode toggle
- [x] Status change from the board
- [x] Priority indicator with semantic colour
- [x] Overdue visual treatment
- [x] Create, edit, and delete forms with optional project association
- [x] Filters for project, status, and priority
- [x] Sorting by due date, priority, and creation date
- [x] Tasks section on the project detail page with inline create

**Exit criteria:** both views render seeded tasks; status transitions persist across reload; `completedAt` is stamped correctly.

---

## Phase 6 — Tags, Snippets & Resources

- [x] `/api/tags` GET and POST with case-insensitive deduplication
- [x] Reusable TagInput supporting inline creation and colour assignment
- [x] Tag chips render in assigned colours; clicking one filters the current view
- [x] `/api/snippets` GET with `language`, `tag`, `q`, and `favorite` filters, and POST
- [x] `/api/snippets/[id]` PATCH and DELETE
- [x] Snippet library page with code previews
- [x] Syntax highlighting with a light theme
- [x] Copy-to-clipboard with confirmation
- [x] Favourite toggle and favourites filter
- [x] Snippet create and edit forms with language selection
- [x] `/api/resources` GET with `type`, `tag`, `isRead`, and `q` filters, and POST
- [x] `/api/resources/[id]` PATCH and DELETE
- [x] Resource list with type badges and domain display
- [x] URL validation via Zod
- [x] Read/unread toggle and filter
- [x] Snippets and Resources sections on the project detail page

**Exit criteria:** tags work identically across all four taggable entities; snippet search matches code bodies; no duplicate tags can be created.

---

## Phase 7 — Journal

- [x] `/api/journal` GET with `projectId` and `q` filters, and POST
- [x] `/api/journal/[id]` GET, PATCH, DELETE
- [x] Reverse-chronological list grouped by date
- [x] Markdown rendering on read
- [x] Raw markdown on edit
- [x] Editable entry date defaulting to today
- [x] Optional project association and tags
- [x] Search across title and content
- [x] Journal section on the project detail page

**Exit criteria:** entries render markdown correctly; date grouping is accurate; project-scoped filtering works.

---

## Phase 8 — Learning

- [x] `/api/learning/goals` GET and POST; `/api/learning/goals/[id]` PATCH and DELETE
- [x] `/api/learning/courses` GET filtered by `goalId`, and POST; `/api/learning/courses/[id]` PATCH and DELETE
- [x] Learning page listing goals with their nested courses
- [x] Separate section for unattached courses
- [x] Goal progress rolled up as the mean of its courses' progress
- [x] Course progress control clamped 0–100
- [x] Completing a course forces progress to 100
- [x] Goal and course create, edit, and delete forms
- [x] Target date display with an overdue indicator

**Exit criteria:** rollup maths is correct including the zero-course case; a course can be created without a goal.

---

## Phase 9 — Dashboard & Polish

- [x] Pinned-projects panel with environment counts
- [x] Needs-attention panel: overdue, due today, due within 7 days
- [x] Aggregate counts across entities
- [x] Most recent journal entry, truncated and linked
- [x] Learning goals in progress with rollup bars
- [x] Quick-add for task and journal entry
- [x] Dashboard empty state for a fresh database
- [x] Audit every list view for loading, empty, and error states
- [x] Audit destructive actions for confirmation
- [x] Audit mutations for success and failure feedback
- [x] Verify keyboard reachability and focus visibility
- [x] Verify layout at 768px, 1024px, and 1440px
- [x] Resolve all TypeScript errors and console warnings
- [x] Finalise README with setup, scripts, and architecture notes

**Exit criteria:** clean clone to running seeded app with no manual intervention; `npx tsc --noEmit` clean; no console errors on any route.

---

## Phase 10 — Optional: GitHub Integration

- [x] Add `GITHUB_TOKEN` to `.env.example`
- [x] Server-side GitHub API client parsing `owner/repo` from a project's `repoUrl`
- [x] Fetch the five most recent commits
- [x] Fetch open pull requests
- [x] Render both on the project detail page when `repoUrl` is present
- [x] Handle a missing token with a clear, non-fatal message
- [x] Handle unreachable or private repositories gracefully
- [x] Handle rate limiting with a specific message
- [x] Cache responses to avoid refetching on every render

**Exit criteria:** the project page renders correctly with a valid token, with an invalid token, and with no token at all — never crashing.

---

## Progress Log

| Phase | Status | Notes |
|---|---|---|
| 0 — Foundation | Completed | Docker Compose Postgres 16, Next.js App Router, Tailwind CSS, packages installed. |
| 1 — Data Layer | Completed | 9 Prisma models with explicit join tables, migrations applied, seed script populated. |
| 2 — Shell & Design System | Completed | Persistent & collapsible sidebar, Motion transitions, shared UI components & Zustand store. |
| 3 — Projects | Completed | Full Project CRUD, slug generation, pin toggle, status/tag filtering, project detail workspace. |
| 4 — Environments | Completed | Environment CRUD grouped by type (Production, Preview, Development), platform badges, URL copy. |
| 5 — Tasks | Completed | Board & List views, status transitions, completedAt stamping, priority indicators, overdue highlight. |
| 6 — Tags, Snippets, Resources | Completed | TagInput with inline creation, Light syntax highlighting code viewer, Bookmark library with Zod URL check. |
| 7 — Journal | Completed | Date-grouped dev log, markdown rendering, raw edit mode, project/tag linking. |
| 8 — Learning | Completed | Goals & nested/standalone courses, dynamic progress rollup (handles 0-course edge case), 0-100 progress sliders. |
| 9 — Dashboard & Polish | Completed | Pinned projects, Needs Attention panel (overdue/today/7d), stats cards, Quick Add modal, tsc clean. |
| 10 — GitHub (optional) | Completed | GitHub integration route for commits & PRs with non-fatal token/repo error handling. |

## Deviations from the PRD

Record anything implemented differently from the spec, with the reason.

| Item | PRD says | Built as | Why |
|---|---|---|---|
| None | N/A | N/A | Fully aligned with PRD specifications across all 10 phases. |
