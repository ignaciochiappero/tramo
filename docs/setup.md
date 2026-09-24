# Set up Tramo from zero

This guide takes a fresh clone to a running app on your machine, then to production on Vercel. Every step says who does it, what to run and how to check it worked, so a person or an AI agent can follow it top to bottom.

> **For AI agents.** Steps marked **Human** need a browser and someone's accounts (Google Cloud, Neon, Vercel). Stop there, tell the person exactly what to do, and continue when they're done. Secrets go straight from the person into `.env.local`: never ask them to paste one into the chat, and never print, log or commit one.

## At a glance

| # | Step | Who | Done when |
| --- | --- | --- | --- |
| 1 | [Install the tools](#1-install-the-tools) | Agent | `node -v` is 20.9 or newer and `pnpm -v` prints 11.5.2 |
| 2 | [Install dependencies](#2-install-dependencies) | Agent | `pnpm install` ends with `Done` |
| 3 | [Start a database](#3-start-a-database) | Agent (local) or Human (Neon) | `docker compose ps` shows `db` as healthy |
| 4 | [Get the Google credentials](#4-get-the-google-credentials) | Human | A client ID and secret in hand |
| 5 | [Write `.env.local`](#5-write-envlocal) | Agent, then Human | Seven variables set, file git-ignored |
| 6 | [Create the tables](#6-create-the-tables) | Agent | `All migrations have been successfully applied` |
| 7 | [Run the app](#7-run-the-app) | Agent, then Human | You're signed in as the admin |
| 8 | [Check the code](#8-check-the-code) | Agent | lint, typecheck, test and build pass |
| 9 | [Deploy to Vercel](#9-deploy-to-vercel) | Human, then Agent | The production URL signs you in |

## 1. Install the tools

| Tool | Version | Check |
| --- | --- | --- |
| Node.js | 20.9 or newer (the current LTS is fine) | `node -v` |
| pnpm | 11.5.2, pinned in `package.json` | `pnpm -v` |
| Docker Desktop | any recent, for the local database | `docker compose version` |
| Git | any recent | `git --version` |

If pnpm is missing, Corepack installs the pinned version:

```bash
corepack enable
```

Docker is only needed for the local database (step 3, option A). Everything else works without it.

## 2. Install dependencies

```bash
pnpm install
```

`postinstall` runs `prisma generate`, which writes the database client to `generated/prisma/`.

**Check:** the command ends with `Done`, and `generated/prisma/client.ts` exists.

## 3. Start a database

The app needs PostgreSQL. Pick one option: A for development on your machine, B for production (or to develop against the cloud). The app picks its driver from the connection string (`lib/database-url.ts`): Neon hosts go through Neon's serverless driver, anything else through node-postgres.

### Option A: local Postgres in Docker (recommended for development)

No account needed. `compose.yaml` defines a Postgres 17 with the user, password and database all set to `tramo`, and a volume so the data survives restarts.

```bash
docker compose up -d --wait
```

**Check:** `docker compose ps` shows the `db` service as `healthy`.

Both connection strings are the same:

```
postgresql://tramo:tramo@localhost:5432/tramo
```

| To… | Run |
| --- | --- |
| Stop it, keeping the data | `docker compose stop` |
| Start it again | `docker compose up -d --wait` |
| Wipe it (then redo step 6) | `docker compose down -v` |

Without Docker, any local Postgres 16 or newer works: create a user and a database, and use its connection string in both variables.

### Option B: Neon (Human)

Production runs on [Neon](https://neon.com); the free plan is enough.

1. Sign up, then create a project in **AWS US East 1**, next to Vercel's default region.
2. On the project dashboard, open **Connect**. You need two connection strings from there:
   - With **Connection pooling** on, the host contains `-pooler`. That's `DATABASE_URL`, the one the app uses.
   - With it off, you get the direct string. That's `DATABASE_URL_UNPOOLED`, the one migrations use.

If the project is on Vercel, you can let Vercel create the database instead: **Storage → Create Database → Neon**, connected to the project. Vercel then adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` to its variables, and `vercel env pull .env.local` copies the Development ones to your machine.

Use one Neon project (or branch) per environment, so development never touches production data.

## 4. Get the Google credentials (Human)

People sign in with Google, so the app needs an OAuth client from Google Cloud.

1. Open the [Google Cloud console](https://console.cloud.google.com). In the project picker on the top bar, choose **New project**, name it (for example, "Tramo"), create it and select it.
2. Search for **Google Auth Platform** and press **Get started**. Fill in the app name, a support email, **External** as the audience and a contact email, then create it.
3. In **Audience → Test users**, add every Google account that will sign in. While the app is in *Testing*, only these accounts can sign in (up to 100). When you want any Google account to be able to reach the sign-in, press **Publish app** there.
4. In **Clients**, press **Create client** and choose **Web application**. Add:
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Press **Create**, then copy the **Client ID** and the **Client secret**. Save the secret right away, or download the JSON. If it's lost, add a new secret to the client and delete the old one.

Google warns that changes to a client can take from 5 minutes to a few hours to apply. If sign-in fails right after an edit, wait and retry.

## 5. Write `.env.local`

**Agent:** copy the template, which explains every variable in place:

```bash
cp .env.example .env.local
```

It already holds the local database strings (option A) and `BETTER_AUTH_URL` for local development. Set `ADMIN_EMAILS`, and with option B, the Neon strings.

**Human:** paste the secrets into `.env.local` yourself: `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

How to get each value:

| Variable | Where it comes from | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Step 3: the local string, or Neon's pooled one | The app's connection. `lib/db.ts` refuses to start without it |
| `DATABASE_URL_UNPOOLED` | Step 3: the local string, or Neon's direct one | Only the Prisma CLI (`pnpm db:migrate`) reads it |
| `BETTER_AUTH_SECRET` | Generate it: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` | Signs sessions. One per environment; never reuse production's |
| `BETTER_AUTH_URL` | The address you open in the browser: `http://localhost:3000` locally, `https://your-project.vercel.app` in production | Exact origin, no trailing slash. It must match the origin registered in Google |
| `GOOGLE_CLIENT_ID` | Step 4 | Ends in `.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Step 4 | Starts with `GOCSPX-` |
| `ADMIN_EMAILS` | The Google accounts that should run the workspace | Spaces and capitals don't matter. Read on every sign-in: restart `pnpm dev`, or redeploy, after a change |

Next.js reads `.env.local` on its own, and `prisma.config.ts` loads it for the Prisma CLI. A variable set in the shell wins over the file.

**Check:** `git check-ignore .env.local` prints `.env.local`, so the file can never be committed.

## 6. Create the tables

```bash
pnpm db:migrate
```

It runs `prisma migrate deploy` over `DATABASE_URL_UNPOOLED`. Builds never migrate, so run this against every new database, production's included.

**Check:** the output ends with `All migrations have been successfully applied`. On a database that's already up to date it says `No pending migrations to apply`, which is fine too.

## 7. Run the app

```bash
pnpm dev
```

**Check (agent):** `curl -s http://localhost:3000/sign-in` returns the sign-in page: its `<title>` is `Tramo`, with a "Continuar con Google" button. Opening `/` without a session also ends up there.

**Check (human):** open <http://localhost:3000>, press **Continuar con Google** and pick an account from `ADMIN_EMAILS`. You land on the home page as the workspace admin. The first admin to sign in creates the workspace, named "Mi espacio"; rename it in **Admin → Workspace**. Then:

1. In **Admin → Projects**, create a project and assign yourself as a tracker.
2. Back on **Inicio**, pick the project and press play. The clock starts.

Everyone else gets in one of two ways. Either an admin invites their Google email from **Admin → Members**, and they enter right away with the projects picked on the invitation. Or they sign in on their own, and wait on a pending request until an admin approves it.

The interface is in Spanish (`es-AR`), and the default time zone is `America/Argentina/Buenos_Aires`. Both are set in `i18n/config.ts`.

## 8. Check the code

The definition of done for every change (see [AGENTS.md](../AGENTS.md)):

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- `pnpm test` needs no database: tests that touch one boot PGlite, a Postgres compiled to WebAssembly, in memory.
- `pnpm build` needs `DATABASE_URL` (`lib/db.ts` checks it when it loads) and `BETTER_AUTH_SECRET` (without it, Better Auth logs errors about its default secret). It doesn't connect to anything while building, so in CI any valid connection string and any secret work.
- End-to-end tests start `pnpm dev` themselves (so they need `.env.local`), plus a browser installed once:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## 9. Deploy to Vercel

1. **Human:** push the repository to GitHub with the app already in it. In Vercel, choose **Add New → Project** and import it.
2. **Human:** check that **Framework Preset** says **Next.js**, and leave Build Command, Output Directory and Install Command without overrides.
3. **Human:** create the production database (step 3, option B), and add the seven variables in **Settings → Environment Variables**:
   - the production database strings;
   - a new `BETTER_AUTH_SECRET`;
   - `BETTER_AUTH_URL` set to the production URL, for example `https://your-project.vercel.app`;
   - the same Google client, and the admin emails.

   Variables apply only to new deployments: redeploy after changing them.
4. **Agent:** create the production tables. Run `pnpm db:migrate` with `DATABASE_URL_UNPOOLED` set in the shell to the production direct string (the shell value wins over `.env.local`), or have the person run it.
5. **Human:** in Google Cloud, add the production origin (`https://your-project.vercel.app`) and redirect URI (`https://your-project.vercel.app/api/auth/callback/google`) to the client.
6. **Check:** `curl -s https://your-project.vercel.app/sign-in` returns the sign-in page, and signing in with an admin email lands on the home page.

> If Vercel imports the repository while it has no `package.json` (say, a first commit with only a README), it sets the preset to **Other**. The build passes, but only `public/` is published and every page answers `404 NOT_FOUND`. Fix it in **Settings → Build and Deployment → Framework Preset → Next.js**, then redeploy.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `DATABASE_URL is not set` | No `.env.local`, or it's not in the project root | Step 5 |
| `ECONNREFUSED` on `localhost:5432` | The local database isn't running | `docker compose up -d --wait` |
| `port is already allocated` when starting Docker | Another Postgres already uses port 5432 | Stop it, or map `"5433:5432"` in `compose.yaml` and use port 5433 in both strings |
| `The table ... does not exist` (Prisma `P2021`) | Migrations weren't applied to that database | Step 6, against that database |
| Google shows `redirect_uri_mismatch` | The redirect URI isn't registered for that origin | Add `<origin>/api/auth/callback/google` to the client (step 4) |
| Google says the app is blocked for an account | The app is in Testing and that account isn't a test user | Add it under **Audience → Test users**, or publish the app |
| Sign-in bounces back to `/sign-in` | `BETTER_AUTH_URL` doesn't match the address in the browser | Fix it, then restart or redeploy |
| After signing in, a "pending access" page | The email isn't in `ADMIN_EMAILS` and wasn't invited | Add it to `ADMIN_EMAILS` (restart or redeploy), or invite it from **Admin → Members** |
| Every page on Vercel answers `404 NOT_FOUND` | The Framework Preset is **Other** | Set it to **Next.js** and redeploy (see step 9) |
| `pnpm typecheck` misses route types after moving pages | Stale generated types | Delete `.next/dev` and run it again |
| End-to-end tests can't find a browser | Chromium isn't installed | `pnpm exec playwright install chromium` |

## Next

- [AGENTS.md](../AGENTS.md): the conventions every change follows.
- [CONTRIBUTING.md](../CONTRIBUTING.md): how to propose a change.
- [`openspec/changes/time-tracking-mvp/`](../openspec/changes/time-tracking-mvp/): why the product and the stack look the way they do.
