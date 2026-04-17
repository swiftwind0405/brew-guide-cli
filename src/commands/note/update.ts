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
    rating: { type: 'string', description: 'Rating (1-5).' },
    method: { type: 'string', description: 'Method name.' },
    memo: { type: 'string', description: 'Tasting notes.' },
    'dry-run': { type: 'boolean', description: 'Preview the operation without executing.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['note', 'update'], args as Record<string, unknown>);

    const updates: Record<string, unknown> = {};
    if (typeof args.rating === 'string') updates.rating = Number.parseInt(args.rating, 10);
    if (typeof args.method === 'string') updates.method = args.method;
    if (typeof args.memo === 'string') updates.notes = args.memo;

    if (Object.keys(updates).length === 0) {
      console.error('No fields to update. Use --rating, --method, --memo, etc.');
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
