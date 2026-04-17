import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { listEquipment } from '../../services/equipment.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'list',
    description: 'List all custom equipment.',
  },
  args: {
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['equipment', 'list'], args as Record<string, unknown>);

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const items = await listEquipment(supabase, config.brewGuideUserId);

      if (items.length === 0) {
        console.log('No equipment found.');
        await logger.success();
        return;
      }

      if (args.format === 'json') {
        console.log(JSON.stringify(items, null, 2));
      } else {
        for (const eq of items) {
          const fields = [
            String(eq.id ?? '').slice(0, 8),
            eq.name,
            eq.animationType,
            eq.hasValve ? 'valve' : '',
          ].filter(Boolean);
          console.log(fields.join(' | '));
        }
        console.log(`\n${items.length} equipment`);
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
