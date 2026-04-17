import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { getBean } from '../../services/beans.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'get',
    description: 'Show details for a specific coffee bean.',
  },
  args: {
    id: { type: 'positional', required: true, description: 'Bean record ID.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['bean', 'get'], args as Record<string, unknown>);

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const bean = await getBean(supabase, args.id, config.brewGuideUserId);

      if (!bean) {
        console.error(`Bean ${args.id} not found.`);
        await logger.error(`Bean ${args.id} not found`);
        process.exit(1);
      }

      if (args.format === 'json') {
        console.log(JSON.stringify(bean, null, 2));
      } else {
        const lines = [
          `ID:          ${bean.id}`,
          `Name:        ${bean.name ?? ''}`,
          `Roaster:     ${bean.roaster ?? ''}`,
          `Roast Level: ${bean.roastLevel ?? ''}`,
          `Bean Type:   ${bean.beanType ?? ''}`,
          `Capacity:    ${bean.remaining ?? '0'}/${bean.capacity ?? '0'}`,
          `Price:       ${bean.price ?? ''}`,
          `Flavor:      ${Array.isArray(bean.flavor) ? (bean.flavor as string[]).join(', ') : ''}`,
          `Notes:       ${bean.notes ?? ''}`,
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
