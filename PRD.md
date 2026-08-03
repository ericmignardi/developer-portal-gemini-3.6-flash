# PRD — Atlas: A Personal Developer Portal

> Working name. Rename freely — but use the **same name in both builds**, since branding leaks into component names, page titles, and README quality.

**Version:** 1.0
**Status:** Approved for build
**Author:** Derived from requirements interview
**Purpose:** Serves as (a) the product spec for the application and (b) the shared scoring rubric for a Claude vs. Gemini build comparison.

---

## 1. Problem Statement

A freelance/contract developer runs several client applications concurrently. Each application has its own repository, its own set of Vercel deployments, and its own Neon database branches. The cost of context switching is not forgetting *what* to do — it is losing track of *where everything lives*: which preview URL maps to which branch, which database branch a given environment points at, and what state a project was left in after two weeks away.

Today that information is scattered across browser tabs, dashboards, terminal history, and memory. The result is repeated lookups, wrong-environment mistakes, and dead time re-orienting at the start of every session.

Atlas consolidates the connective tissue of multi-project development work into a single local application: what projects exist, where their environments live, what is outstanding, what was learned, and what is worth keeping.

---

## 2. Target User

**Exactly one user.** A working developer juggling multiple concurrent client projects. Technically expert — no onboarding, no tooltips, no hand-holding. Runs the app locally alongside their editor.

There is no multi-tenancy, no authentication, no roles, no sharing, and no `userId` on any table. Any build that introduces auth has misread the spec.

---

## 3. Goals

1. **Kill the re-orientation tax.** Opening a project's page should answer "where is everything and what state is it in" in under ten seconds, without opening the Vercel or Neon dashboard.
2. **Make environments a first-class object.** Vercel deployments and Neon branches are tracked records, not tribal knowledge.
3. **Give every scattered artifact one home.** Snippets, links, and dev-log notes stop living in tabs and gists.
4. **Be worth opening daily.** The dashboard must present a genuine "what now?" answer, not just navigation.
5. **Serve as a fair, measurable comparison target.** Every P0 requirement below is written as a binary, checkable acceptance criterion.

---

## 4. Non-Goals

| Out of scope | Why |
|---|---|
| Authentication, users, roles, sharing | Single user, localhost only. Adds environment-dependent variance with zero product value. |
| Deployment to Vercel/Neon | The app runs locally against Docker Postgres. Deployment introduces env-var and migration variables that would pollute the comparison. |
| Live Vercel or Neon API integration | Environments are user-maintained records. Reading live deployment state is a separate initiative. |
| Time tracking / timers | Requires running-state management and aggregation. Scope creep disguised as a checkbox. |
| Job applications, interview prep, contacts | A different product with a different lifecycle. |
| Mobile layouts below 768px | Desktop tool used beside an editor. Tablet-width graceful degradation is sufficient. |
| Real-time collaboration, websockets, notifications | No second user exists. |

---

## 5. Technical Constraints

These are **fixed**. A build that substitutes any of them has failed a requirement.

| Concern | Requirement |
|---|---|
| Framework | Next.js (App Router), TypeScript, strict mode |
| UI | React, TailwindCSS |
| Icons | Lucide React |
| Animation | Motion (`motion` package) |
| Validation | Zod — schemas shared between client forms and server handlers |
| Client state | Zustand (filter/search/UI state). Server data may be fetched however the implementer prefers. |
| Database | PostgreSQL 16 via `docker-compose.yml` committed to the repo |
| ORM | Prisma, with migrations committed and a working seed script |
| Auth | **None** |
| Hosting | Localhost only |

**Deliberately left open** — these are where build quality is judged, and prescribing them would reduce the comparison to transcription:

- Folder and module structure
- Server Components vs. Client Components boundaries
- Server Actions vs. Route Handlers for mutations *(note: the REST contract in §8 must exist regardless)*
- Component decomposition and shared-primitive design
- Data-fetching and cache-invalidation strategy
- Error handling and validation-surfacing patterns
- Whether to add tests

---

## 6. Data Model

Nine entities. Tag is deliberately many-to-many across four models — naive implementations store a comma-separated string, correct ones use join tables.

### Project
The spine. Everything optional hangs off it.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | Required |
| slug | String | Unique, URL-safe, derived from name |
| client | String? | Client or company name |
| description | String? | Markdown supported |
| status | Enum | `IDEA` \| `ACTIVE` \| `PAUSED` \| `SHIPPED` \| `ARCHIVED` |
| repoUrl | String? | GitHub URL |
| liveUrl | String? | Production URL |
| techStack | String[] | e.g. `["Next.js","Prisma"]` |
| isPinned | Boolean | Default false; pinned projects surface on the dashboard |
| startedAt | DateTime? | |
| createdAt / updatedAt | DateTime | |

Relations: many Environments, many Tasks, many Snippets, many Resources, many JournalEntries, many Tags (m2m).

### Environment
The entity that solves the core problem. Belongs to exactly one Project.

| Field | Type | Notes |
|---|---|---|
| id | String | PK |
| projectId | String | FK, cascade delete |
| name | String | e.g. "Production", "Preview — feat/checkout" |
| platform | Enum | `VERCEL` \| `NEON` \| `LOCAL` \| `OTHER` |
| type | Enum | `PRODUCTION` \| `PREVIEW` \| `DEVELOPMENT` |
| branch | String? | Git or Neon branch name |
| url | String? | Deployment or connection endpoint |
| notes | String? | Free text — e.g. which Neon branch this Vercel preview points at |
| createdAt / updatedAt | DateTime | |

### Task

| Field | Type | Notes |
|---|---|---|
| id | String | PK |
| title | String | Required |
| description | String? | |
| status | Enum | `TODO` \| `IN_PROGRESS` \| `BLOCKED` \| `DONE` |
| priority | Enum | `LOW` \| `MEDIUM` \| `HIGH` \| `URGENT` |
| dueDate | DateTime? | |
| projectId | String? | Nullable — standalone tasks allowed |
| order | Int | Manual sort position within a status column |
| completedAt | DateTime? | Set when status becomes `DONE` |
| createdAt / updatedAt | DateTime | |

### Snippet

| Field | Type | Notes |
|---|---|---|
| id | String | PK |
| title | String | Required |
| description | String? | |
| language | String | e.g. `typescript`, `sql`, `bash` |
| code | String | `@db.Text` |
| projectId | String? | Nullable |
| isFavorite | Boolean | Default false |
| createdAt / updatedAt | DateTime | |

Relations: many Tags (m2m).

### Resource

| Field | Type | Notes |
|---|---|---|
| id | String | PK |
| title | String | Required |
| url | String | Required, validated as URL |
| description | String? | |
| type | Enum | `ARTICLE` \| `DOCS` \| `VIDEO` \| `TOOL` \| `REPO` \| `OTHER` |
| projectId | String? | Nullable |
| isRead | Boolean | Default false |
| createdAt / updatedAt | DateTime | |

Relations: many Tags (m2m).

### JournalEntry

| Field | Type | Notes |
|---|---|---|
| id | String | PK |
| title | String? | |
| content | String | `@db.Text`, markdown |
| entryDate | DateTime | Defaults to now, user-editable |
| projectId | String? | Nullable |
| createdAt / updatedAt | DateTime | |

Relations: many Tags (m2m).

### LearningGoal

| Field | Type | Notes |
|---|---|---|
| id | String | PK |
| title | String | e.g. "Get comfortable with Rust" |
| description | String? | The "why" |
| targetDate | DateTime? | |
| status | Enum | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` \| `ABANDONED` |
| createdAt / updatedAt | DateTime | |

Relations: many Courses.

### Course

| Field | Type | Notes |
|---|---|---|
| id | String | PK |
| title | String | Required |
| provider | String? | e.g. "Frontend Masters" |
| url | String? | |
| status | Enum | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` \| `ABANDONED` |
| progressPercent | Int | 0–100, default 0 |
| learningGoalId | String? | **Nullable** — courses can stand alone |
| notes | String? | |
| createdAt / updatedAt | DateTime | |

### Tag

| Field | Type | Notes |
|---|---|---|
| id | String | PK |
| name | String | Unique, lowercased on write |
| color | String | Hex, e.g. `#6366f1` |

Relations: m2m with Project, Snippet, Resource, JournalEntry — **via explicit join tables, not string arrays**.

---

## 7. Requirements

Each P0 criterion is binary. The comparison score in §12 counts them.

### 7.1 Global Shell — P0

- [ ] Persistent left sidebar navigating to Dashboard, Projects, Tasks, Snippets, Resources, Journal, Learning
- [ ] Active route is visually indicated
- [ ] Sidebar collapses to an icon rail and the state persists across navigation
- [ ] Every list view implements three distinct states: loading, empty (with a call to action), and error
- [ ] No hydration mismatch errors in the browser console
- [ ] Page transitions animated with Motion, under 300ms

### 7.2 Dashboard (`/`) — P0

- [ ] Pinned projects displayed as cards showing name, client, status, and environment count
- [ ] "Needs attention" panel: overdue tasks, then tasks due today, then tasks due within 7 days
- [ ] Counts for active projects, open tasks, snippets, unread resources
- [ ] Most recent journal entry, truncated, linking to the full entry
- [ ] Learning goals in progress with a rolled-up progress bar
- [ ] Quick-add control that creates a task or journal entry without leaving the page
- [ ] Empty state when the database is fresh, pointing at project creation

### 7.3 Projects — P0

- [ ] `/projects` lists all projects as cards with name, client, status badge, tech-stack chips, and tag chips
- [ ] Filter by status; filter by tag; free-text search on name/client/description
- [ ] Create, edit, delete a project; delete requires confirmation and cascades to environments
- [ ] Slug generated from name and guaranteed unique
- [ ] Pin/unpin from both the list and the detail page
- [ ] `/projects/[slug]` detail page with tabbed or sectioned areas for Overview, Environments, Tasks, Snippets, Resources, Journal
- [ ] Overview shows description, repo and live links (opening in a new tab), tech stack, tags, dates
- [ ] Each related section shows only records belonging to that project, with inline create

### 7.4 Environments — P0

- [ ] Environments managed from within the project detail page
- [ ] Create, edit, delete with fields: name, platform, type, branch, url, notes
- [ ] Grouped or visually distinguished by type (production / preview / development)
- [ ] Platform indicated by icon or badge
- [ ] URL rendered as a click-through link when present
- [ ] Copy-to-clipboard on the URL, with visible confirmation feedback

### 7.5 Tasks — P0

- [ ] `/tasks` offers both a board view grouped by status and a list view; the choice persists
- [ ] Create, edit, delete tasks; optional project association
- [ ] Change status from the board (drag-and-drop **or** an explicit control — both acceptable)
- [ ] Setting status to `DONE` stamps `completedAt`
- [ ] Priority shown as a colour-coded indicator
- [ ] Overdue due dates visually distinguished
- [ ] Filter by project, status, and priority; sort by due date, priority, or creation date

### 7.6 Snippets — P0

- [ ] `/snippets` grid or list with title, language badge, tags, and a code preview
- [ ] Create, edit, delete with language selection from a defined list
- [ ] Syntax highlighting using a **light** theme consistent with the overall palette
- [ ] Copy-to-clipboard on the full snippet with visible confirmation
- [ ] Filter by language and tag; free-text search across title, description, and code body
- [ ] Favourite toggle, with a favourites-only filter

### 7.7 Resources — P0

- [ ] `/resources` list with title, type badge, domain, and tags
- [ ] Create, edit, delete; URL validated by Zod
- [ ] Mark read/unread; filter by read state, type, tag, and project
- [ ] Free-text search across title and description

### 7.8 Journal — P0

- [ ] `/journal` reverse-chronological list grouped by date
- [ ] Create, edit, delete entries with a markdown body and an editable entry date
- [ ] Markdown rendered on read, raw on edit
- [ ] Optional project association and tags
- [ ] Free-text search across title and content

### 7.9 Learning — P0

- [ ] `/learning` lists goals, each showing its courses
- [ ] Create, edit, delete goals and courses
- [ ] Courses can be created unattached to any goal and displayed in a separate section
- [ ] Goal progress rolled up as the mean `progressPercent` of its courses
- [ ] Course progress editable via slider or numeric input, clamped 0–100
- [ ] Setting a course to `COMPLETED` forces progress to 100

### 7.10 Tags — P0

- [ ] Tags created inline from any tagging control, without a separate management screen
- [ ] Duplicate tag names impossible (case-insensitive)
- [ ] Tags render with their assigned colour everywhere they appear
- [ ] Clicking a tag filters the current view by it

### 7.11 Data Layer — P0

- [ ] `docker-compose.yml` starts Postgres with credentials matching `.env.example`
- [ ] `prisma/schema.prisma` implements §6 exactly, including join tables for tags
- [ ] Migrations committed
- [ ] Seed script creating at least 4 projects, 10 environments, 20 tasks, 8 snippets, 10 resources, 6 journal entries, 3 learning goals with courses, and 10 tags
- [ ] `README.md` with setup steps that work from a clean clone
- [ ] Zod schemas validate on both client and server; server never trusts client input

### 7.12 Nice-to-Have — P1

- [ ] Global command palette (Cmd/Ctrl-K) searching across all entities
- [ ] Optimistic UI updates on status and toggle mutations
- [ ] Keyboard shortcuts for quick-add
- [ ] Dashboard activity feed of recent changes across entities
- [ ] Bulk operations on tasks
- [ ] Dark mode

### 7.13 Optional Stretch — Scored Separately

- [ ] **GitHub integration.** Read-only. Personal access token from `.env`. On a project detail page where `repoUrl` is set, display the five most recent commits and any open pull requests. Must degrade gracefully with a clear message when the token is missing, the repo is unreachable, or the rate limit is hit — a crash or an unhandled rejection fails this item.

### 7.14 Future Considerations — P2, do not build

Live Vercel/Neon API sync; environment health checks; snippet version history; export to markdown; full-text search via Postgres `tsvector`.

---

## 8. API Contract

Both builds must expose this REST surface under `/api`, so responses can be compared directly. Internal implementation is open; mutations may additionally be wired through Server Actions if the implementer prefers, but these endpoints must exist and work.

| Method | Path | Purpose |
|---|---|---|
| GET / POST | `/api/projects` | List (query params: `status`, `tag`, `q`) / create |
| GET / PATCH / DELETE | `/api/projects/[id]` | Read / update / delete |
| GET / POST | `/api/environments` | List (`projectId`) / create |
| PATCH / DELETE | `/api/environments/[id]` | Update / delete |
| GET / POST | `/api/tasks` | List (`projectId`, `status`, `priority`) / create |
| PATCH / DELETE | `/api/tasks/[id]` | Update / delete |
| GET / POST | `/api/snippets` | List (`language`, `tag`, `q`, `favorite`) / create |
| PATCH / DELETE | `/api/snippets/[id]` | Update / delete |
| GET / POST | `/api/resources` | List (`type`, `tag`, `isRead`, `q`) / create |
| PATCH / DELETE | `/api/resources/[id]` | Update / delete |
| GET / POST | `/api/journal` | List (`projectId`, `q`) / create |
| GET / PATCH / DELETE | `/api/journal/[id]` | Read / update / delete |
| GET / POST | `/api/learning/goals` | List / create |
| PATCH / DELETE | `/api/learning/goals/[id]` | Update / delete |
| GET / POST | `/api/learning/courses` | List (`goalId`) / create |
| PATCH / DELETE | `/api/learning/courses/[id]` | Update / delete |
| GET / POST | `/api/tags` | List / create |

**Conventions:** JSON throughout. `200` read, `201` create, `204` delete, `400` with a Zod-derived field-error object on validation failure, `404` missing, `500` unexpected. Errors return `{ error: string, fields?: Record<string,string[]> }`.

---

## 9. Information Architecture

```
/                      Dashboard
/projects              Project list
/projects/[slug]       Project detail — overview, environments, tasks, snippets, resources, journal
/tasks                 Board + list views
/snippets              Snippet library
/resources             Bookmark library
/journal               Dev log
/journal/[id]          Single entry
/learning              Goals and courses
```

---

## 10. Design Direction

**Light, airy, generous whitespace.** Notion-adjacent, not Linear-dark.

- **Palette:** white and near-white surfaces (`#ffffff`, `#fafafa`), a neutral grey scale for text and borders, one accent colour used sparingly for primary actions and active states. Status and priority colours are semantic and consistent across the app.
- **Typography:** one clean sans-serif (Inter or the Next.js default) with a clear size hierarchy. Monospace for code, branch names, and URLs.
- **Density:** roomy. Generous padding inside cards, real spacing between sections. Resist table-dense layouts.
- **Surfaces:** subtle 1px borders and soft radii over heavy drop shadows.
- **Icons:** Lucide, 16–20px, consistently sized within a context.
- **Motion:** used for page transitions, list item enter/exit, and modal open/close. Subtle and fast — 150–300ms. Motion should never delay interaction.
- **Code:** a **light** syntax theme (GitHub Light or equivalent). Dark code blocks on a white page are a defect, not a style choice.
- **Empty states:** illustrated or iconographic, with a specific call to action — never a bare "No data".

---

## 11. Non-Functional Requirements

- TypeScript strict; no `any` in application code
- No console errors or warnings in normal operation
- Every mutation surfaces success and failure to the user
- Every destructive action is confirmed
- Layout works from 768px upward
- Interactive elements are keyboard reachable with visible focus states
- Initial dashboard render under 2 seconds on seeded local data
- No secrets committed; `.env.example` present and complete

---

## 12. Comparison Protocol

The point of this document is a fair A/B. Follow this or the result is noise.

**Identical conditions.** Same kickoff prompt, same PRD, same PLAN, empty repo, no prior context. Do not correct, hint, or clarify differently between the two.

**Snapshot rule.** Score each build at the point where it completes the work following from the kickoff prompt and its own autonomous continuation — **before any human corrective prompt.** Record the state, then continue iterating afterward for your own use. Without this, unbounded time flattens both builds to 100% and the comparison measures only patience.

**Scoring.**

| Criterion | Weight | Method |
|---|---|---|
| Feature completeness | 40% | P0 checkboxes in §7 satisfied ÷ total P0 checkboxes |
| Code quality & architecture | 30% | Structure, typing, duplication, separation of concerns, error handling, naming |
| Design polish & UX | 20% | Adherence to §10, state coverage, interaction quality |
| Runs correctly on first try | 10% | Clean-clone setup to working seeded app with no manual fixes |
| **GitHub integration** | Bonus | Scored and reported separately, never folded into completeness |

**Also record:** total files, total lines, npm dependencies added beyond the mandated stack, TypeScript errors on `tsc --noEmit`, and console errors on first load.

---

## 13. Open Questions

- **Non-blocking, implementer's discretion:** drag-and-drop vs. explicit controls for task status; which markdown renderer; which syntax highlighter.
- **Non-blocking, resolve during build:** whether snippet code search should use Postgres full-text or a simple `ILIKE` — start with `ILIKE`.
- **Blocking if pursued:** GitHub integration requires a personal access token with `repo` scope before Phase 10 begins.
