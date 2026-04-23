import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { updateNote } from '../../services/notes.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'update',
    description: 'Update a brewing note.',
  },
  args: {
    id: { type: 'positional', required: true, description: 'Note record ID.' },
    rating: { type: 'string', description: 'Rating 0-5 (accepts decimals like 3.5).' },
    method: { type: 'string', description: 'Method name.' },
    memo: { type: 'string', description: 'Tasting notes.' },
    notes: { type: 'string', description: 'Free-form notes (authoritative; alias of --memo).' },
    equipment: { type: 'string', description: 'Equipment row id.' },
    'dry-run': { type: 'boolean', description: 'Preview the operation without executing.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['note', 'update'], args as Record<string, unknown>);

    const updates: Record<string, unknown> = {};
    if (typeof args.rating === 'string') {
      const r = Number.parseFloat(args.rating);
      if (!Number.isFinite(r) || r < 0 || r > 5) {
        console.error('Error: --rating must be a number between 0 and 5.');
        process.exit(2);
      }
      updates.rating = r;
    }
    if (typeof args.method === 'string') updates.method = args.method;
    if (typeof args.equipment === 'string') updates.equipment = args.equipment;
    if (typeof args.notes === 'string') updates.notes = args.notes;
    else if (typeof args.memo === 'string') updates.notes = args.memo;

    if (Object.keys(updates).length === 0) {
      console.error('No fields to update. Use --rating, --method, --memo, --notes, --equipment.');
      process.exit(2);
    }

    if (args['dry-run']) {
      if (args.format === 'json') {
        console.log(JSON.stringify({ dryRun: true, action: 'update', id: args.id, updates }));
      } else {
        console.log(`[dry-run] Would update note ${args.id.slice(0, 8)}:\n${JSON.stringify(updates, null, 2)}`);
      }
      await logger.success();
      return;
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const result = await updateNote(supabase, args.id, updates, config.brewGuideUserId);

      if (!result) {
        console.error(`Note ${args.id} not found.`);
        await logger.error(`Note ${args.id} not found`);
        process.exit(1);
      }

      if (args.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Updated note ${args.id.slice(0, 8)}`);
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
