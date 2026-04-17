import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { deleteEquipment } from '../../services/equipment.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'delete',
    description: 'Soft-delete equipment.',
  },
  args: {
    id: { type: 'positional', required: true, description: 'Equipment ID.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['equipment', 'delete'], args as Record<string, unknown>);

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const deleted = await deleteEquipment(supabase, args.id, config.brewGuideUserId);

      if (!deleted) {
        console.error(`Equipment ${args.id} not found.`);
        await logger.error(`Equipment ${args.id} not found`);
        process.exit(1);
      }

      if (args.format === 'json') {
        console.log(JSON.stringify({ deleted: args.id }));
      } else {
        console.log(`Deleted equipment ${args.id.slice(0, 8)}`);
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
