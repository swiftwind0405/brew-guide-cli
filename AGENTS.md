# AGENTS.md

Agent instructions for working in `brew-guide-cli`.

## Read this first for Supabase work

If a task touches Supabase access, schema assumptions, RPCs, auth, RLS, SQL, migrations, or `@supabase/supabase-js` usage:

1. Read `docs/supabase.md` first.
2. Then consult the latest official Supabase docs.
3. Only then change code.

## Official Supabase docs access

Use `supabase.sh` over SSH for up-to-date docs before making Supabase-specific changes:

```bash
# Search docs
ssh supabase.sh grep -rl 'auth' /supabase/docs/

# Read a specific guide
ssh supabase.sh cat /supabase/docs/guides/auth/passwords.md

# Find docs in a section
ssh supabase.sh find /supabase/docs/guides/database -name '*.md'

# Search with grep
ssh supabase.sh grep -r 'RLS' /supabase/docs/guides --include='*.md' -l
```

All docs are exposed under `/supabase/docs/`.

## Project-specific rules that matter here

- This project currently uses a **service-role key** for Supabase access.
- Records are scoped by `user_id`.
- Core business fields live in the `data` JSONB column.
- Beans, notes, and equipment use **soft delete** via `deleted_at`.
- `custom_methods` is special: one row stores all methods for an equipment item in `data.methods`.
- The CLI depends on a Postgres RPC named `public.get_all_roasters()`.

Do not assume default Supabase examples match this repository's data model.

## Required files to check before changing Supabase code

At minimum, inspect the relevant ones:

- `docs/supabase.md`
- `README.md`
- `src/config.ts`
- `src/services/base.ts`
- `src/services/beans.ts`
- `src/services/notes.ts`
- `src/services/equipment.ts`
- `src/services/methods.ts`
- `src/tools/getAllRoasters.ts`
- `src/lib/tables.ts`

## Rules for changes

When changing Supabase-related code:

1. Preserve the current `user_id` scoping unless the task explicitly changes tenancy behavior.
2. Preserve soft-delete semantics unless the task explicitly changes deletion behavior.
3. Do not rename or remove `get_all_roasters()` usage without updating setup docs and SQL.
4. If you change payload shape assumptions, update `docs/supabase.md` and any affected README/skill docs in the same change.
5. If you add migrations later, keep docs and migrations synchronized.

## Secrets and safety

- Never commit real service-role keys or live credentials.
- Treat local config files as sensitive.
- Avoid suggesting weaker auth patterns just because they are common in generic examples.

## Good workflow for agents

For Supabase tasks:

1. read project docs
2. inspect relevant code
3. check official docs
4. make minimal code changes
5. update docs if assumptions changed
