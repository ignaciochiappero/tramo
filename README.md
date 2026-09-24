# Tramo: time tracking for small teams

*Tu trabajo, tramo a tramo.* A web app to track how much time each person spends on each project: a timer that floats over your other apps, weekly views, and metrics. It's built for a small team running several projects in parallel. The type is brutalist, with poster-sized titles and numbers; the rest is soft, rounded and borderless.

Tramo is open source under the [Apache License 2.0](LICENSE). To run it, follow [docs/setup.md](docs/setup.md): it goes from a fresh clone to production, step by step, and people and AI agents can follow it as is.

## What it does

| Where | What you get |
| --- | --- |
| **Home** (`/`) | The timer: pick a project, describe the task (autocomplete from your past tasks), press play. Pause and resume keep the task's clock going from where it was; the stop button finishes the task. The clock reads in tall blocks (hours, minutes, seconds), and its buttons wear the logo's hexagon. A floating always-on-top window, upright unless it's very flat, where the browser supports it (Chrome, Edge, Firefox on desktop). An 8-hour "did you forget it?" prompt. Your latest blocks, editable. Observers get their projects and this week's hours per person instead |
| **Week** (`/week`) | Your week in your time zone: total, a projects × days table, and every block by day. Add time you forgot to track (start and end picked from quarter-hour lists); fix or delete your own blocks. **Equipo** shows the team's week: every block in your projects, with who logged it |
| **Metrics** (`/metrics`) | For a range and an optional project: the total, hours per person, per project and per task, and week over week. Admins see everything; members see the projects they belong to |
| **Admin → Members** | Invite by Google email (optionally with the projects the person joins, as tracker or viewer), approve or reject access requests, switch roles |
| **Admin → Projects** | Create, rename, recolor and archive projects; drag people onto them or use "Assign" |
| **Settings** | Eight palettes (Lima, Salvia, Cielo, Índigo, Orquídea, Coral, Ámbar and Grafito, the grey one) × dark and light, saved to your account. The logo and the browser tab's icon take the palette's accent |
| **Help** (the ? in the header) | A guided tour that points at what to touch on each screen. It starts on the first visit, can be skipped and resumed where it was left, and adapts to trackers, observers and admins |

The rules that keep hours honest: one running timer per person, no overlapping blocks for the same person, no blocks in the future, and every manual creation or edit is flagged.

## Getting started

The full guide, with how to get every credential, is [docs/setup.md](docs/setup.md). In short:

1. Install dependencies: `pnpm install`.
2. Start the local database: `docker compose up -d --wait`.
3. Create a Google OAuth client, then write `.env.local` ([step 5](docs/setup.md#5-write-envlocal) says where each value comes from).
4. Create the tables: `pnpm db:migrate`.
5. Start the app: `pnpm dev`, open <http://localhost:3000> and continue with Google. The people listed in `ADMIN_EMAILS` enter as admins; the first one creates the workspace.
6. Verify: `pnpm lint && pnpm typecheck && pnpm test`.

## How access works

| Who | What happens on sign-in |
| --- | --- |
| Email in `ADMIN_EMAILS` | Active admin of the workspace (created by the first one to sign in) |
| Email invited from **Admin → Members** | Active member with the invited role, immediately, already inside the projects picked on the invitation |
| Anyone else | A pending request. They see nothing until an admin approves it |

Access is checked on the server for every request (`lib/dal.ts`), never only in the UI.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, strict TypeScript |
| Styling | Tailwind CSS v4, CSS-first tokens in `app/globals.css` |
| i18n | next-intl, a single locale (`es-AR`) with no URL prefix |
| Icons | lucide-react |
| Tests | Vitest (unit) and Playwright (end-to-end) |
| Data | PostgreSQL with Prisma 7: Neon's serverless driver in production, node-postgres against the local Docker database |
| Auth | Better Auth with Google, sessions in the database |

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` / `pnpm lint:fix` | ESLint (flat config) |
| `pnpm typecheck` | Generates route types, then runs `tsc --noEmit` |
| `pnpm test` / `pnpm test:watch` | Vitest unit tests |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm db:migrate` | Applies pending migrations to the database in `.env.local` |
| `pnpm db:migrate:dev` | Creates a new migration from `prisma/schema.prisma` (development) |
| `pnpm db:studio` | Opens Prisma Studio |
| `pnpm noise` | Rebuilds the grain textures in `public/` |

The local database runs with Docker: `docker compose up -d --wait` starts it, `docker compose stop` stops it.

## Where things live

| Path | Holds |
| --- | --- |
| `app/` | Routing only: pages, layouts, route handlers |
| `features/<feature>/` | Everything for one feature: components, actions, queries, schemas |
| `components/common/` | Domain-free UI primitives (e.g. `RadioGroup`) |
| `components/global/` | App chrome (navigation, shell) |
| `lib/` | Cross-cutting helpers that never mention a business entity |
| `messages/` | All UI copy, one file per locale |
| `e2e/` | Playwright specs |
| `prisma/` | The database schema and its migrations |
| `docs/` | The setup guide |
| `openspec/changes/time-tracking-mvp/` | Product discovery and technical decision records |

## Contributing

Contributions are welcome, from people and from AI agents. Start with [CONTRIBUTING.md](CONTRIBUTING.md); the conventions every change follows are in [AGENTS.md](AGENTS.md).

## License

Tramo is licensed under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE) for attributions.
