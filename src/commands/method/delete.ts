import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { deleteMethod } from '../../services/methods.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'delete',
    description: 'Delete a brewing method.',
  },
  args: {
    id: { type: 'positional', required: true, description: 'Method ID.' },
    'dry-run': { type: 'boolean', description: 'Preview the operation without executing.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['method', 'delete'], args as Record<string, unknown>);

    if (args['dry-run']) {
      if (args.format === 'json') {
        console.log(JSON.stringify({ dryRun: true, action: 'delete', id: args.id }));
      } else {
        console.log(`[dry-run] Would delete method ${args.id.slice(0, 8)}`);
      }
      await logger.success();
      return;
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const deleted = await deleteMethod(supabase, args.id, config.brewGuideUserId);

      if (!deleted) {
        console.error(`Method ${args.id} not found.`);
        await logger.error(`Method ${args.id} not found`);
        process.exit(1);
      }

      if (args.format === 'json') {
        console.log(JSON.stringify({ deleted: args.id }));
      } else {
        console.log(`Deleted method ${args.id.slice(0, 8)}`);
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
