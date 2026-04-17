import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { updateMethod } from '../../services/methods.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'update',
    description: 'Update a brewing method.',
  },
  args: {
    id: { type: 'positional', required: true, description: 'Method ID.' },
    name: { type: 'string', description: 'Method name.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['method', 'update'], args as Record<string, unknown>);

    const updates: Record<string, unknown> = {};
    if (typeof args.name === 'string') updates.name = args.name;

    if (Object.keys(updates).length === 0) {
      console.error('No fields to update. Use --name.');
      process.exit(2);
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const result = await updateMethod(supabase, args.id, updates, config.brewGuideUserId);

      if (!result) {
        console.error(`Method ${args.id} not found.`);
        await logger.error(`Method ${args.id} not found`);
        process.exit(1);
      }

      if (args.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Updated method: ${result.name ?? args.id}`);
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
