import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { getEquipment } from '../../services/equipment.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'get',
    description: 'Show details for specific equipment.',
  },
  args: {
    id: { type: 'positional', required: true, description: 'Equipment ID.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['equipment', 'get'], args as Record<string, unknown>);

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const eq = await getEquipment(supabase, args.id, config.brewGuideUserId);

      if (!eq) {
        console.error(`Equipment ${args.id} not found.`);
        await logger.error(`Equipment ${args.id} not found`);
        process.exit(1);
      }

      if (args.format === 'json') {
        console.log(JSON.stringify(eq, null, 2));
      } else {
        const lines = [
          `ID:    ${eq.id}`,
          `Name:  ${eq.name ?? ''}`,
          `Type:  ${eq.animationType ?? ''}`,
          `Valve: ${eq.hasValve ? 'yes' : 'no'}`,
          `Note:  ${eq.note ?? ''}`,
        ];
        console.log(lines.join('\n'));
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
