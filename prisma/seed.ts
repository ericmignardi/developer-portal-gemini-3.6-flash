import { PrismaClient, ProjectStatus, Platform, EnvironmentType, TaskStatus, TaskPriority, ResourceType, LearningStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning existing database...");
  await prisma.tagOnProject.deleteMany();
  await prisma.tagOnSnippet.deleteMany();
  await prisma.tagOnResource.deleteMany();
  await prisma.tagOnJournalEntry.deleteMany();
  await prisma.environment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.snippet.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.course.deleteMany();
  await prisma.learningGoal.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.project.deleteMany();

  console.log("Creating Tags...");
  const tagsData = [
    { name: "nextjs", color: "#000000" },
    { name: "react", color: "#06b6d4" },
    { name: "typescript", color: "#3178c6" },
    { name: "prisma", color: "#2d3748" },
    { name: "postgres", color: "#336791" },
    { name: "neon", color: "#00e599" },
    { name: "vercel", color: "#171717" },
    { name: "tailwind", color: "#38bdf8" },
    { name: "auth", color: "#f59e0b" },
    { name: "performance", color: "#ef4444" },
  ];

  const tags: Record<string, any> = {};
  for (const t of tagsData) {
    tags[t.name] = await prisma.tag.create({
      data: t,
    });
  }

  console.log("Creating Projects...");
  const p1 = await prisma.project.create({
    data: {
      name: "Pulse Analytics",
      slug: "pulse-analytics",
      client: "Acme Corp",
      description: "Real-time SaaS dashboard and event tracking service for e-commerce stores.",
      status: ProjectStatus.ACTIVE,
      repoUrl: "https://github.com/acme/pulse-analytics",
      liveUrl: "https://pulse.acme.com",
      techStack: ["Next.js", "TypeScript", "TailwindCSS", "Prisma", "PostgreSQL"],
      isPinned: true,
      startedAt: new Date("2026-01-15"),
      tags: {
        create: [
          { tagId: tags["nextjs"].id },
          { tagId: tags["typescript"].id },
          { tagId: tags["prisma"].id },
          { tagId: tags["postgres"].id },
        ],
      },
    },
  });

  const p2 = await prisma.project.create({
    data: {
      name: "Nova Commerce Platform",
      slug: "nova-commerce-platform",
      client: "Starlight Retail",
      description: "Headless e-commerce frontend with Next.js App Router and Shopify Storefront API integration.",
      status: ProjectStatus.ACTIVE,
      repoUrl: "https://github.com/starlight/nova-commerce",
      liveUrl: "https://nova-shop.vercel.app",
      techStack: ["Next.js", "React", "TypeScript", "TailwindCSS", "Neon"],
      isPinned: true,
      startedAt: new Date("2026-03-01"),
      tags: {
        create: [
          { tagId: tags["react"].id },
          { tagId: tags["nextjs"].id },
          { tagId: tags["neon"].id },
          { tagId: tags["tailwind"].id },
        ],
      },
    },
  });

  const p3 = await prisma.project.create({
    data: {
      name: "Hyperion AI Engine",
      slug: "hyperion-ai-engine",
      client: "Apex Labs",
      description: "Internal portal for custom RAG document indexing, prompt evaluation, and vector retrieval.",
      status: ProjectStatus.PAUSED,
      repoUrl: "https://github.com/apex/hyperion-ai",
      techStack: ["Python", "FastAPI", "TypeScript", "PostgreSQL"],
      isPinned: false,
      startedAt: new Date("2025-11-10"),
      tags: {
        create: [
          { tagId: tags["typescript"].id },
          { tagId: tags["postgres"].id },
        ],
      },
    },
  });

  const p4 = await prisma.project.create({
    data: {
      name: "Zenith Design System",
      slug: "zenith-design-system",
      client: "Internal / Open Source",
      description: "Accessible component library built with TailwindCSS and Radix Primitives for internal client apps.",
      status: ProjectStatus.SHIPPED,
      repoUrl: "https://github.com/dev/zenith-ui",
      liveUrl: "https://zenith-ui.dev",
      techStack: ["React", "TypeScript", "TailwindCSS"],
      isPinned: true,
      startedAt: new Date("2025-08-01"),
      tags: {
        create: [
          { tagId: tags["react"].id },
          { tagId: tags["tailwind"].id },
        ],
      },
    },
  });

  const p5 = await prisma.project.create({
    data: {
      name: "Vanguard Mobile API",
      slug: "vanguard-mobile-api",
      client: "Vanguard Logistics",
      description: "REST & GraphQL API gateway servicing mobile driver iOS/Android apps.",
      status: ProjectStatus.IDEA,
      techStack: ["Node.js", "TypeScript", "Prisma", "PostgreSQL"],
      isPinned: false,
      tags: {
        create: [
          { tagId: tags["typescript"].id },
          { tagId: tags["auth"].id },
        ],
      },
    },
  });

  console.log("Creating Environments...");
  const envsData = [
    {
      projectId: p1.id,
      name: "Production (Vercel)",
      platform: Platform.VERCEL,
      type: EnvironmentType.PRODUCTION,
      branch: "main",
      url: "https://pulse.acme.com",
      notes: "Auto-deploys on commit to main branch. Connects to primary Neon DB production branch.",
    },
    {
      projectId: p1.id,
      name: "Staging (Vercel Preview)",
      platform: Platform.VERCEL,
      type: EnvironmentType.PREVIEW,
      branch: "staging",
      url: "https://pulse-git-staging-acme.vercel.app",
      notes: "Staging environment for client reviews.",
    },
    {
      projectId: p1.id,
      name: "Prod Database (Neon)",
      platform: Platform.NEON,
      type: EnvironmentType.PRODUCTION,
      branch: "main-db",
      url: "postgres://user:pass@ep-prod.neon.tech/pulse_prod",
      notes: "Primary Neon database branch with daily automated backups.",
    },
    {
      projectId: p1.id,
      name: "Local Dev",
      platform: Platform.LOCAL,
      type: EnvironmentType.DEVELOPMENT,
      branch: "feat/analytics-v2",
      url: "http://localhost:3000",
      notes: "Running against local Docker Postgres on port 5432.",
    },
    {
      projectId: p2.id,
      name: "Production App",
      platform: Platform.VERCEL,
      type: EnvironmentType.PRODUCTION,
      branch: "main",
      url: "https://nova-shop.vercel.app",
      notes: "Production store deployed on Vercel Edge Network.",
    },
    {
      projectId: p2.id,
      name: "Preview - Checkout Rebuild",
      platform: Platform.VERCEL,
      type: EnvironmentType.PREVIEW,
      branch: "feat/checkout-rebuild",
      url: "https://nova-git-feat-checkout-starlight.vercel.app",
      notes: "Testing Stripe integration and instant cart drawer.",
    },
    {
      projectId: p2.id,
      name: "Development Branch (Neon)",
      platform: Platform.NEON,
      type: EnvironmentType.DEVELOPMENT,
      branch: "dev-branch-v2",
      url: "postgres://user:pass@ep-dev.neon.tech/nova_dev",
      notes: "Isolated Neon database branch for schema migrations testing.",
    },
    {
      projectId: p3.id,
      name: "Local FastAPI Container",
      platform: Platform.LOCAL,
      type: EnvironmentType.DEVELOPMENT,
      branch: "main",
      url: "http://localhost:8000",
      notes: "FastAPI server running with uvicorn reloader.",
    },
    {
      projectId: p3.id,
      name: "Staging AI Node",
      platform: Platform.OTHER,
      type: EnvironmentType.PREVIEW,
      branch: "eval/prompt-v3",
      url: "https://staging-ai.apexlabs.internal",
      notes: "Internal staging server hosted on Fly.io.",
    },
    {
      projectId: p4.id,
      name: "Storybook Docs Page",
      platform: Platform.VERCEL,
      type: EnvironmentType.PRODUCTION,
      branch: "main",
      url: "https://zenith-ui.dev",
      notes: "Published documentation website built with Storybook.",
    },
  ];

  for (const env of envsData) {
    await prisma.environment.create({ data: env });
  }

  console.log("Creating Tasks...");
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);
  const in2Days = new Date(now.getTime() + 2 * 86400000);
  const in5Days = new Date(now.getTime() + 5 * 86400000);
  const in10Days = new Date(now.getTime() + 10 * 86400000);
  const pastOverdue = new Date(now.getTime() - 3 * 86400000);

  const tasksData = [
    { title: "Fix memory leak in web analytics event processor", description: "Trace heap allocation during high event throughput.", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.URGENT, dueDate: pastOverdue, projectId: p1.id, order: 1 },
    { title: "Migrate database schema to Prisma 6", description: "Test clean migration scripts and update relations.", status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: yesterday, projectId: p1.id, order: 2 },
    { title: "Implement dark/light auto theme toggle", description: "Ensure high contrast accessible colors across all UI components.", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: in2Days, projectId: p1.id, order: 3 },
    { title: "Configure Vercel preview deployment hooks", description: "Automatically trigger Neon DB branch creations on PR open.", status: TaskStatus.DONE, priority: TaskPriority.HIGH, dueDate: yesterday, completedAt: yesterday, projectId: p1.id, order: 4 },
    { title: "Optimize lighthouse performance score to 95+", description: "Audit bundle sizes and dynamic imports.", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, dueDate: in5Days, projectId: p1.id, order: 5 },
    { title: "Set up Stripe Webhook handling for subscription updates", description: "Validate signature and handle invoice.payment_failed.", status: TaskStatus.TODO, priority: TaskPriority.URGENT, dueDate: in2Days, projectId: p2.id, order: 1 },
    { title: "Redesign cart drawer component with smooth animations", description: "Use Framer Motion for slide-over drawer transitions.", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, dueDate: in5Days, projectId: p2.id, order: 2 },
    { title: "Add product filtering by tag and price range", description: "Client-side filtering state with URL query parameters.", status: TaskStatus.TODO, priority: TaskPriority.LOW, dueDate: in10Days, projectId: p2.id, order: 3 },
    { title: "Fix mobile navigation overlay z-index bug", description: "Navigation menu rendering behind header sticky bar.", status: TaskStatus.DONE, priority: TaskPriority.HIGH, dueDate: yesterday, completedAt: yesterday, projectId: p2.id, order: 4 },
    { title: "Audit security headers and CORS configuration", description: "Add CSP and HSTS headers in next.config.js.", status: TaskStatus.BLOCKED, priority: TaskPriority.HIGH, dueDate: in5Days, projectId: p2.id, order: 5 },
    { title: "Evaluate pgvector vs Pinecone for RAG storage", description: "Benchmark latency and cost for 100k vectors in Postgres.", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: in10Days, projectId: p3.id, order: 1 },
    { title: "Refactor prompt template ingestion pipeline", description: "Support dynamic variable insertion in system prompts.", status: TaskStatus.BLOCKED, priority: TaskPriority.LOW, projectId: p3.id, order: 2 },
    { title: "Publish Zenith v2.0 component library to NPM", description: "Bump version, generate clean typescript declarations and changelog.", status: TaskStatus.DONE, priority: TaskPriority.URGENT, completedAt: yesterday, projectId: p4.id, order: 1 },
    { title: "Write unit tests for Zenith Combobox component", description: "Ensure full ARIA compliance and keyboard navigation support.", status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, completedAt: yesterday, projectId: p4.id, order: 2 },
    { title: "Draft Vanguard API spec with OpenAPI 3.0", description: "Define authentication flow and initial endpoints.", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: in10Days, projectId: p5.id, order: 1 },
    { title: "Renew SSL certificates on VPS server", description: "Run certbot dry run and configure auto-renewal timer.", status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: pastOverdue, order: 1 },
    { title: "Update local development Docker setup for Postgres 16", description: "Ensure pgvector extension is enabled by default.", status: TaskStatus.DONE, priority: TaskPriority.LOW, completedAt: yesterday, order: 2 },
    { title: "Review monthly infrastructure cost on AWS and Neon", description: "Prune unused Neon preview branches and old Vercel deployments.", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: in2Days, order: 3 },
    { title: "Clean up local SSH keys and config file", description: "Organize client SSH profiles into separate config includes.", status: TaskStatus.DONE, priority: TaskPriority.LOW, completedAt: yesterday, order: 4 },
    { title: "Backup local Postgres development databases", description: "Dump all client databases into encrypted S3 bucket.", status: TaskStatus.TODO, priority: TaskPriority.LOW, dueDate: in5Days, order: 5 },
  ];

  for (const t of tasksData) {
    await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status as TaskStatus,
        priority: t.priority as TaskPriority,
        dueDate: t.dueDate,
        completedAt: t.completedAt,
        projectId: t.projectId,
        order: t.order,
      },
    });
  }

  console.log("Creating Snippets...");
  const snippetsData = [
    {
      title: "Prisma Singleton Client for Next.js App Router",
      description: "Prevents multiple Prisma Client instances during HMR in development.",
      language: "typescript",
      code: `import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;`,
      projectId: p1.id,
      isFavorite: true,
      tags: [tags["typescript"].id, tags["prisma"].id, tags["nextjs"].id],
    },
    {
      title: "Clean Slugify Utility Function",
      description: "Converts strings into URL-safe clean slugs for Prisma models.",
      language: "typescript",
      code: `export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\\s+/g, "-")
    .replace(/[^\\w\\-]+/g, "")
    .replace(/\\-\\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}`,
      projectId: p1.id,
      isFavorite: true,
      tags: [tags["typescript"].id],
    },
    {
      title: "Next.js App Router API Error Handler Wrapper",
      description: "Standardized API response wrapper with Zod validation error formatting.",
      language: "typescript",
      code: `import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const path = err.path.join(".");
      if (!fields[path]) fields[path] = [];
      fields[path].push(err.message);
    });
    return NextResponse.json({ error: "Validation failed", fields }, { status: 400 });
  }

  console.error("Unhandled API Error:", error);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}`,
      projectId: p2.id,
      isFavorite: true,
      tags: [tags["typescript"].id, tags["nextjs"].id],
    },
    {
      title: "PostgreSQL Database Branch Cleanup Query",
      description: "SQL query to find and terminate inactive connections before branch dropping.",
      language: "sql",
      code: `SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'target_database_name'
  AND pid <> pg_backend_pid();`,
      projectId: p1.id,
      isFavorite: false,
      tags: [tags["postgres"].id, tags["neon"].id],
    },
    {
      title: "TailwindCSS Custom Scrollbar Styling",
      description: "Clean minimalist scrollbar classes for dark/light themes.",
      language: "css",
      code: `/* Custom scrollbar utility */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}`,
      projectId: p4.id,
      isFavorite: false,
      tags: [tags["tailwind"].id],
    },
    {
      title: "Docker Compose PostgreSQL 16 Template",
      description: "Quick startup config for Postgres with named data volume.",
      language: "yaml",
      code: `services:
  postgres:
    image: postgres:16-alpine
    container_name: dev_postgres
    restart: always
    environment:
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: dev_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`,
      isFavorite: true,
      tags: [tags["postgres"].id],
    },
    {
      title: "Zustand Persisted Store Setup",
      description: "Client-side state persistence with localStorage hydration safety.",
      language: "typescript",
      code: `import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: "ui-storage" }
  )
);`,
      isFavorite: false,
      tags: [tags["react"].id, tags["typescript"].id],
    },
    {
      title: "Git Alias for Clean Interactive Rebase",
      description: "Useful terminal shortcuts for daily workflow.",
      language: "bash",
      code: `# Add to ~/.zshrc or ~/.bashrc
alias glog="git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
alias gpf="git push --force-with-lease"
alias gcb="git checkout -b"`,
      isFavorite: false,
      tags: [tags["vercel"].id],
    },
  ];

  for (const s of snippetsData) {
    const { tags: snippetTagIds, ...rest } = s;
    await prisma.snippet.create({
      data: {
        ...rest,
        tags: {
          create: snippetTagIds.map((tagId) => ({ tagId })),
        },
      },
    });
  }

  console.log("Creating Resources...");
  const resourcesData = [
    {
      title: "Next.js App Router Documentation",
      url: "https://nextjs.org/docs/app",
      description: "Official guide to Server Components, Layouts, and Data Fetching.",
      type: ResourceType.DOCS,
      projectId: p1.id,
      isRead: true,
      tags: [tags["nextjs"].id, tags["react"].id],
    },
    {
      title: "Neon Database Branching Workflows",
      url: "https://neon.tech/docs/conceptual-guides/branching",
      description: "How to integrate database branching into GitHub pull request CI/CD.",
      type: ResourceType.ARTICLE,
      projectId: p1.id,
      isRead: false,
      tags: [tags["neon"].id, tags["postgres"].id],
    },
    {
      title: "Prisma Schema Best Practices & Performance Optimization",
      url: "https://www.prisma.io/docs/guides/performance-and-optimization",
      description: "Indexes, explicit m2m join tables, and query tuning.",
      type: ResourceType.DOCS,
      projectId: p1.id,
      isRead: true,
      tags: [tags["prisma"].id, tags["typescript"].id],
    },
    {
      title: "TailwindCSS v4 Migration Guide",
      url: "https://tailwindcss.com/docs/v4-beta",
      description: "Overview of CSS-first configuration and new performance improvements.",
      type: ResourceType.DOCS,
      projectId: p4.id,
      isRead: false,
      tags: [tags["tailwind"].id],
    },
    {
      title: "Mastering React 19 Server Actions & Optimistic Updates",
      url: "https://react.dev/reference/rsc/server-actions",
      description: "Deep dive into useActionState and useOptimistic hook patterns.",
      type: ResourceType.ARTICLE,
      projectId: p2.id,
      isRead: false,
      tags: [tags["react"].id, tags["nextjs"].id],
    },
    {
      title: "Framer Motion Layout Animations & Shared Element Transitions",
      url: "https://motion.dev/docs/react-animation",
      description: "Tutorial on liquid smooth enter/exit animations and reordering.",
      type: ResourceType.VIDEO,
      projectId: p4.id,
      isRead: true,
      tags: [tags["react"].id],
    },
    {
      title: "Lucide Icon Library Explorer",
      url: "https://lucide.dev/icons/",
      description: "Searchable database of clean, consistent vector icons for React.",
      type: ResourceType.TOOL,
      isRead: true,
      tags: [tags["react"].id],
    },
    {
      title: "Zod Schema Validation Deep Dive",
      url: "https://zod.dev/",
      description: "TypeScript-first schema validation with type inference.",
      type: ResourceType.DOCS,
      isRead: true,
      tags: [tags["typescript"].id],
    },
    {
      title: "GitHub Actions for Neon Database Branching",
      url: "https://github.com/neondatabase/create-branch-action",
      description: "Automate ephemeral database branch creation on pull requests.",
      type: ResourceType.REPO,
      projectId: p2.id,
      isRead: false,
      tags: [tags["neon"].id, tags["vercel"].id],
    },
    {
      title: "Web Vitals & Performance Monitoring in 2026",
      url: "https://web.dev/vitals/",
      description: "Understanding INP, LCP, and CLS performance metrics.",
      type: ResourceType.ARTICLE,
      projectId: p1.id,
      isRead: false,
      tags: [tags["performance"].id],
    },
  ];

  for (const r of resourcesData) {
    const { tags: resourceTagIds, ...rest } = r;
    await prisma.resource.create({
      data: {
        ...rest,
        tags: {
          create: resourceTagIds.map((tagId) => ({ tagId })),
        },
      },
    });
  }

  console.log("Creating Journal Entries...");
  const journalData = [
    {
      title: "Pulse Analytics: Database Migration & Multi-tenant Query Fix",
      content: `## Session Overview

Spent the morning optimizing Prisma query performance on the \`Pulse Analytics\` dashboard. We noticed latency spikes when fetching event counts over large date ranges.

### Key Changes
- Added composite index on \`[projectId, createdAt]\` in the schema.
- Replaced in-memory mapping with native \`groupBy\` queries.
- Created a separate preview database branch on Neon for testing under load.

\`\`\`ts
// Optimized aggregation query
const stats = await prisma.event.groupBy({
  by: ['eventType'],
  where: { projectId, createdAt: { gte: startDate } },
  _count: true,
});
\`\`\`

Everything is green now on staging!`,
      entryDate: new Date("2026-07-28T14:30:00Z"),
      projectId: p1.id,
      tags: [tags["prisma"].id, tags["postgres"].id, tags["performance"].id],
    },
    {
      title: "Nova Commerce Checkout Architecture & Stripe Integration",
      content: `Refactored the checkout flow for Starlight Retail's e-commerce shop. 

### Architecture Notes
1. **Cart Drawer**: Client-side state managed via Zustand with persistent local storage backup.
2. **Stripe Checkout Session**: Server Action triggers API call to Stripe and returns redirected URL.
3. **Neon Preview Branch**: Paired with the Vercel feature branch deployment for end-to-end integration testing.

Needs final QA before shipping to main branch tomorrow morning.`,
      entryDate: new Date("2026-07-30T10:15:00Z"),
      projectId: p2.id,
      tags: [tags["nextjs"].id, tags["react"].id, tags["neon"].id],
    },
    {
      title: "Weekly Context Switch & Portfolio Audit",
      content: `### Friday Review
- **Pulse Analytics**: Active sprint running smooth. All P0 tasks on schedule.
- **Nova Commerce**: Cart drawer ready, waiting on client approval for landing page banner.
- **Zenith UI**: Shipped v2.0 release on NPM!
- **Infrastructure**: Cleaned up 3 dead preview branches in Vercel to save build minutes.

Plan for next week: Focus on hyperion-ai vector benchmark evaluation.`,
      entryDate: new Date("2026-08-01T17:00:00Z"),
      tags: [tags["vercel"].id, tags["typescript"].id],
    },
    {
      title: "Investigating Memory Spike in Next.js Server Components",
      content: `Noticed node process memory growing during extended dev sessions with HMR. 

Root cause was un-cached database client instances creating multiple connection pools in background. Fixed by establishing the global singleton pattern in \`lib/prisma.ts\`.`,
      entryDate: new Date("2026-08-02T11:45:00Z"),
      projectId: p1.id,
      tags: [tags["nextjs"].id, tags["prisma"].id],
    },
    {
      title: "Exploring Tailwind v4 CSS-First Configuration",
      content: `Tested Tailwind CSS v4 in a standalone prototype.
The new \`@theme\` inline syntax in \`globals.css\` eliminates the need for \`tailwind.config.js\` for standard custom color tokens.

Super clean setup and noticeably faster build times!`,
      entryDate: new Date("2026-08-02T16:20:00Z"),
      projectId: p4.id,
      tags: [tags["tailwind"].id],
    },
    {
      title: "Reflections on Personal Developer Portal Architecture",
      content: `Designing Atlas as a single-user personal developer portal running on localhost.

Key architectural goal: **Kill the context switching cost.** Having projects, environments, open tasks, snippets, and dev logs in one single view is already making daily client work significantly smoother.`,
      entryDate: new Date("2026-08-03T08:00:00Z"),
      tags: [tags["typescript"].id, tags["nextjs"].id],
    },
  ];

  for (const j of journalData) {
    const { tags: journalTagIds, ...rest } = j;
    await prisma.journalEntry.create({
      data: {
        ...rest,
        tags: {
          create: journalTagIds.map((tagId) => ({ tagId })),
        },
      },
    });
  }

  console.log("Creating Learning Goals & Courses...");
  const g1 = await prisma.learningGoal.create({
    data: {
      title: "Master Rust for Systems & WebAssembly",
      description: "Build deep understanding of memory safety, borrow checker, and WASM integration.",
      targetDate: new Date("2026-10-31"),
      status: LearningStatus.IN_PROGRESS,
    },
  });

  const g2 = await prisma.learningGoal.create({
    data: {
      title: "Deep Dive into Vector Databases & LLM RAG Pipelines",
      description: "Learn pgvector, embeddings generation, chunking strategies, and hybrid search.",
      targetDate: new Date("2026-09-15"),
      status: LearningStatus.IN_PROGRESS,
    },
  });

  const g3 = await prisma.learningGoal.create({
    data: {
      title: "Advanced Web Performance & Distributed Tracing",
      description: "Understand eBPF, OpenTelemetry, Core Web Vitals, and browser rendering pipeline.",
      targetDate: new Date("2026-12-01"),
      status: LearningStatus.NOT_STARTED,
    },
  });

  const coursesData = [
    {
      title: "Ultimate Rust Foundations",
      provider: "Frontend Masters",
      url: "https://frontendmasters.com/courses/rust/",
      status: LearningStatus.COMPLETED,
      progressPercent: 100,
      learningGoalId: g1.id,
      notes: "Finished all exercises and built CLI file watcher.",
    },
    {
      title: "Practical Systems Programming in Rust",
      provider: "Udemy",
      url: "https://udemy.com/course/rust-systems",
      status: LearningStatus.IN_PROGRESS,
      progressPercent: 45,
      learningGoalId: g1.id,
      notes: "Currently working through async tokio network server chapter.",
    },
    {
      title: "Building Production RAG Systems with Python & Postgres",
      provider: "DeepLearning.AI",
      url: "https://deeplearning.ai/courses/rag-postgres",
      status: LearningStatus.IN_PROGRESS,
      progressPercent: 75,
      learningGoalId: g2.id,
      notes: "Great module on semantic re-ranking with Cohere.",
    },
    {
      title: "Vector Search Foundations with pgvector",
      provider: "Neon Academy",
      url: "https://neon.tech/academy/pgvector",
      status: LearningStatus.COMPLETED,
      progressPercent: 100,
      learningGoalId: g2.id,
      notes: "Learned HNSW vs IVFFlat indexing trade-offs.",
    },
    {
      title: "Web Vitals Masterclass",
      provider: "Web.dev",
      url: "https://web.dev/learn/performance",
      status: LearningStatus.NOT_STARTED,
      progressPercent: 0,
      learningGoalId: g3.id,
      notes: "Plan to start next month after RAG pipeline work.",
    },
    // Standalone course unattached to any goal (PRD §7.9 requirement!)
    {
      title: "TypeScript Magic: Advanced Type System Patterns",
      provider: "Total TypeScript",
      url: "https://totaltypescript.com",
      status: LearningStatus.IN_PROGRESS,
      progressPercent: 60,
      learningGoalId: null,
      notes: "Standalone deep dive into conditional types and template literal types.",
    },
    {
      title: "CSS Grid & Flexbox Masterclass",
      provider: "Wes Bos",
      url: "https://cssgrid.io",
      status: LearningStatus.COMPLETED,
      progressPercent: 100,
      learningGoalId: null,
      notes: "Quick reference refresher course.",
    },
  ];

  for (const c of coursesData) {
    await prisma.course.create({ data: c });
  }

  console.log("Seeding complete successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
