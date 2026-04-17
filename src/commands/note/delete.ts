import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { deleteNote } from '../../services/notes.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'delete',
    description: 'Soft-delete a brewing note.',
  },
  args: {
    id: { type: 'positional', required: true, description: 'Note record ID.' },
    'dry-run': { type: 'boolean', description: 'Preview the operation without executing.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['note', 'delete'], args as Record<string, unknown>);

    if (args['dry-run']) {
      if (args.format === 'json') {
        console.log(JSON.stringify({ dryRun: true, action: 'delete', id: args.id }));
      } else {
        console.log(`[dry-run] Would delete note ${args.id.slice(0, 8)}`);
      }
      await logger.success();
      return;
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const deleted = await deleteNote(supabase, args.id, config.brewGuideUserId);

      if (!deleted) {
        console.error(`Note ${args.id} not found.`);
        await logger.error(`Note ${args.id} not found`);
        process.exit(1);
      }

      if (args.format === 'json') {
        console.log(JSON.stringify({ deleted: args.id }));
      } else {
        console.log(`Deleted note ${args.id.slice(0, 8)}`);
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
