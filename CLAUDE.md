# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. `AGENTS.md` and `GEMINI.md` are symlinks to this file.

## Project overview

`brew-guide-cli` — standalone Citty CLI for operating [brew-guide](https://github.com/chuthree/brew-guide) data in Supabase. Manages coffee beans, brewing notes, equipment, custom brewing methods, and roasters from the terminal. Distributed as `brew-guide` bin via npm; also ships a `brew-guide` skill bundle under `skills/`.

## Tech stack

- Node.js >= 18, TypeScript (ESM, `NodeNext`, strict)
- CLI framework: `citty`
- Supabase: `@supabase/supabase-js` (service-role key)
- Config loader: `c12`
- Schema validation: `@sinclair/typebox`
- Bundler: `tsup` (esm, node18 target, adds shebang banner)
- Tests: node built-in test runner via `tsx`

## Commands

```bash
npm run dev               # run CLI locally via tsx (src/main.ts)
npm run build             # tsup bundle → dist/main.js (chmod +x on postbuild)
npm run build:watch       # watch mode
npm run typecheck         # tsc --noEmit
npm test                  # tsc + node --import tsx --test (tests/*.test.mjs)
```

Run single test: `node --import tsx --test tests/bean-add.test.mjs`.

`prepublishOnly` enforces `typecheck && build`.

## Project layout

```
src/
  main.ts             # citty entry, banner via tsup
  client.ts           # Supabase client factory (service-role)
  config.ts           # c12 config loader; ~/.config/brew-guide/config.json
  logger.ts paths.ts
  commands/           # citty subcommands: bean/ equipment/ method/ note/ init.ts roasters.ts
  services/           # supabase data access: base.ts beans.ts notes.ts equipment.ts methods.ts
  tools/              # e.g. getAllRoasters.ts (wraps RPC)
  lib/                # tables.ts etc.
  types/
tests/                # *.test.mjs, node --test
skills/brew-guide/    # SKILL.md + references/ (shipped to npm)
docs/
  supabase.md         # authoritative Supabase conventions — READ FIRST for DB work
  plans/
```

## Supabase rules (critical — do not skip)

If a task touches Supabase access, schema assumptions, RPCs, auth, RLS, SQL, migrations, or `@supabase/supabase-js` usage:

1. Read `docs/supabase.md` first.
2. Consult latest official Supabase docs via `supabase.sh` SSH (see below).
3. Only then change code.

### Project-specific data model

- Uses **service-role key** for Supabase access (bypasses RLS).
- Records scoped by `user_id`.
- Core business fields live in the `data` JSONB column.
- `coffee_beans`, `brewing_notes`, `equipment` use **soft delete** via `deleted_at`.
- `custom_methods` is special: one row per equipment item; all methods stored in `data.methods` array.
- CLI depends on Postgres RPC `public.get_all_roasters()` (see README for DDL).

Do not assume generic Supabase examples match this data model.

### Files to inspect before changing Supabase code

At minimum: `docs/supabase.md`, `README.md`, `src/config.ts`, `src/services/base.ts`, `src/services/beans.ts`, `src/services/notes.ts`, `src/services/equipment.ts`, `src/services/methods.ts`, `src/tools/getAllRoasters.ts`, `src/lib/tables.ts`.

### Change rules

1. Preserve `user_id` scoping unless task explicitly changes tenancy.
2. Preserve soft-delete semantics unless task explicitly changes deletion behavior.
3. Do not rename/remove `get_all_roasters()` usage without updating setup docs and SQL.
4. If payload shape assumptions change, update `docs/supabase.md` and affected README/skill docs in the same change.
5. If migrations added later, keep docs and migrations synchronized.

### Official Supabase docs access

Use `supabase.sh` over SSH for fresh docs:

```bash
ssh supabase.sh grep -rl 'auth' /supabase/docs/
ssh supabase.sh cat /supabase/docs/guides/auth/passwords.md
ssh supabase.sh find /supabase/docs/guides/database -name '*.md'
ssh supabase.sh grep -r 'RLS' /supabase/docs/guides --include='*.md' -l
```

All docs live under `/supabase/docs/`.

## Secrets and safety

- Never commit real service-role keys or live credentials.
- Treat local config files (`~/.config/brew-guide/config.json`, `BREW_GUIDE_CONFIG_PATH`) as sensitive.
- Do not suggest weaker auth patterns just because generic examples use them.

## Code conventions

- ESM only (`"type": "module"`); use `.ts` imports (tsconfig `allowImportingTsExtensions` + `rewriteRelativeImportExtensions`).
- Strict TypeScript; no `any` drift.
- Citty commands: one subcommand per file under `src/commands/<group>/`, re-export from group index; follow existing bean/note/equipment/method patterns.
- Data access always via `src/services/*` — do not call Supabase client directly from commands.
- Update `skills/brew-guide/SKILL.md` and its `references/` when user-facing command surface changes.

## Workflow for agents

Supabase task: read project docs → inspect services → check official docs → make minimal change → update docs if assumptions changed.

Non-Supabase task: follow existing command/service patterns; run `npm run typecheck` and `npm test` before declaring done.
