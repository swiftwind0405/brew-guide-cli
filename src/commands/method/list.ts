import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { listMethods } from '../../services/methods.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'list',
    description: 'List brewing methods.',
  },
  args: {
    'equipment-id': { type: 'string', description: 'Filter by equipment ID.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['method', 'list'], args as Record<string, unknown>);

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const equipmentId = typeof args['equipment-id'] === 'string' ? args['equipment-id'] : undefined;
      const items = await listMethods(supabase, config.brewGuideUserId, equipmentId);

      if (items.length === 0) {
        console.log('No methods found.');
        await logger.success();
        return;
      }

      if (args.format === 'json') {
        console.log(JSON.stringify(items, null, 2));
      } else {
        for (const m of items) {
          const params = (m.params ?? {}) as Record<string, unknown>;
          const stages = Array.isArray(params.stages) ? params.stages : [];
          const fields = [
            String(m.id ?? '').slice(0, 8),
            m.name,
            params.coffee || '-',
            params.water || '-',
            params.ratio || '-',
            `${stages.length} stages`,
          ].filter(Boolean);
          console.log(fields.join(' | '));
        }
        console.log(`\n${items.length} methods`);
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
