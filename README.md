# Atlas — Personal Developer Portal

Atlas is a personal developer portal designed for freelance and contract developers running multiple client applications concurrently. It consolidates scattered Vercel preview deployments, Neon database branches, tasks, code snippets, bookmarked resources, dev journal entries, and learning goals into a single local dashboard on localhost.

## Technology Stack

- **Framework**: Next.js (App Router, Server Components & Client Components, Strict TypeScript)
- **UI & Styling**: React 19, TailwindCSS, Lucide Icons, Custom SVGs
- **Animation**: Motion (`motion` package) for smooth page transitions and micro-interactions
- **Validation**: Zod (schemas shared between client forms and REST API handlers)
- **Client State**: Zustand with persistent storage (`store/useUIStore.ts`)
- **Database & ORM**: PostgreSQL 16 (via Docker Compose) & Prisma v6 with committed schema and seed script

---

## Quick Start (Clean Setup)

Follow these steps from a fresh clone:

```bash
# 1. Start PostgreSQL 16 container
docker compose up -d

# 2. Install dependencies
npm install

# 3. Apply database migrations
npx prisma migrate dev

# 4. Seed the database with rich sample data
npx prisma db seed

# 5. Run local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architectural Decisions

1. **Explicit Many-to-Many Join Tables**:
   - `Tag` is linked across `Project`, `Snippet`, `Resource`, and `JournalEntry` via explicit join models (`TagOnProject`, `TagOnSnippet`, `TagOnResource`, `TagOnJournalEntry`) rather than string arrays. This ensures case-insensitive deduplication, strict referential integrity, and efficient relational querying.

2. **REST API Contract & Validation Scoping**:
   - All REST routes under `/api/*` conform strictly to PRD §8 requirements. Inputs are parsed through Zod validation schemas in `lib/validations/`, returning standardized JSON responses `{ error: string, fields?: Record<string, string[]> }` with `400 Bad Request` on invalid payloads.

3. **Client State & Persistence**:
   - Zustand (`store/useUIStore.ts`) manages global interactive states including collapsible sidebar, toast notifications, confirmation dialogs, quick-add modal, and persistent task view preferences (Board vs. List).

4. **Light-Themed Code Block Aesthetics**:
   - Per PRD §10 visual requirements, code blocks strictly use a GitHub Light syntax theme with copy-to-clipboard feedback.

5. **Learning Goal Progress Rollup**:
   - Learning goal completion percentages are dynamically calculated as the mean `progressPercent` of nested courses. For goals with zero courses, the progress safely defaults to `0%` (preventing `NaN` edge cases).

6. **Optional GitHub Integration**:
   - `/api/github` fetches recent commits and open pull requests when `repoUrl` is present. It degrades gracefully without crashing if `GITHUB_TOKEN` is absent, unreachable, or rate-limited.

---

## Project Structure

```
gemini/
├── app/
│   ├── api/                # REST API route handlers (/api/projects, /api/tasks, etc.)
│   ├── projects/           # Project list & detail views (/projects, /projects/[slug])
│   ├── tasks/              # Task board and list view (/tasks)
│   ├── snippets/           # Code snippet library (/snippets)
│   ├── resources/          # Bookmark library (/resources)
│   ├── journal/            # Dev log entries (/journal, /journal/[id])
│   ├── learning/           # Goals and courses (/learning)
│   ├── globals.css         # Base styles & light scrollbar configuration
│   ├── layout.tsx          # Root shell layout with persistent sidebar & header
│   └── page.tsx            # Dashboard overview page
├── components/
│   ├── layout/             # Sidebar, Header, QuickAddModal, PageWrapper
│   ├── ui/                 # Shared primitives (Button, Card, Modal, CodeHighlight, etc.)
│   ├── states/             # Reusable LoadingState, EmptyState, ErrorState
│   ├── projects/           # Project management modals & components
│   ├── environments/       # Environment grouping & copy-to-clipboard tools
│   ├── tasks/              # Task modals & card components
│   ├── snippets/           # Snippet modal components
│   ├── resources/          # Resource modal components
│   ├── journal/            # Journal modal components
│   └── learning/           # Goal & course modals
├── lib/
│   ├── prisma.ts           # Singleton Prisma Client for HMR
│   ├── utils.ts            # Formatting, classnames, and slugify helpers
│   ├── api-response.ts     # Standardized JSON error response handler
│   └── validations/        # Zod validation schemas for all entities
├── prisma/
│   ├── schema.prisma       # Prisma 9-entity relational data model
│   └── seed.ts             # Rich seed script with 5 projects & full sample data
├── docker-compose.yml      # PostgreSQL 16 container service definition
├── README.md               # Setup and architectural documentation
└── PLAN.md                 # Execution plan and progress log
```
