# Contributing to Tramo

Thanks for helping Tramo grow. Changes of any size are welcome, from a typo to a feature, whether a person or an AI agent writes them.

## Quick path

1. Get the app running with [docs/setup.md](docs/setup.md). The local database (Docker) is enough; you don't need a Neon account.
2. Read [AGENTS.md](AGENTS.md): the conventions are short, and every change follows them.
3. Branch off `main`, write the test first, then the change.
4. Before opening a pull request, run the definition of done: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`.
5. Open the pull request, saying what changes for the person using the app and how you checked it.

## How changes are made here

| Topic | Rule |
| --- | --- |
| Tests | A feature starts with a failing test. Vitest covers logic, schemas and the data access layer; Playwright covers pages and sign-in flows |
| Commits | [Conventional Commits](https://www.conventionalcommits.org), one work unit per commit, each with its tests and docs |
| Pull requests | Small and focused. Split anything that grows past ~400 changed lines |
| UI copy | Every string lives in `messages/es-AR.json`, never in a component |
| Look | Tokens only (`app/globals.css`), no UI component library, soft shapes with brutalist type. See AGENTS.md |
| Access | Checks live in `lib/dal.ts` and run on every page. Never in a layout |
| Decisions | Product and technical records live in `openspec/changes/time-tracking-mvp/`. Update them when a change moves a decision |

## Common changes

| To… | Do this |
| --- | --- |
| Change the database | Edit `prisma/schema.prisma`, then run `pnpm db:migrate:dev --name <what-changed>` against your local database. Commit the new folder under `prisma/migrations/` with the change |
| Add a theme palette | Add it to `PALETTES` and `THEME_ACCENTS` in `lib/theme.ts`, its two blocks in `app/globals.css` and its name in `messages/es-AR.json`. `lib/theme.test.ts` checks its contrast |
| Add UI text | Add the key to `messages/es-AR.json` and read it with next-intl |

## Reporting a problem

Open an issue with what you did, what you expected and what happened instead. Add screenshots for anything visual. Never paste secrets or the contents of `.env.local`.

## License

Tramo is licensed under the [Apache License 2.0](LICENSE). By contributing, you agree that your contributions are licensed under it too.
