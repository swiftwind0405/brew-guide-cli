import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { getMethod } from '../../services/methods.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'get',
    description: 'Show details for a specific method including stages.',
  },
  args: {
    id: { type: 'positional', required: true, description: 'Method ID.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['method', 'get'], args as Record<string, unknown>);

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const method = await getMethod(supabase, args.id, config.brewGuideUserId);

      if (!method) {
        console.error(`Method ${args.id} not found.`);
        await logger.error(`Method ${args.id} not found`);
        process.exit(1);
      }

      if (args.format === 'json') {
        console.log(JSON.stringify(method, null, 2));
      } else {
        const params = (method.params ?? {}) as Record<string, unknown>;
        const stages = Array.isArray(params.stages) ? params.stages : [];

        const lines = [
          `ID:          ${method.id}`,
          `Name:        ${method.name ?? ''}`,
          `Equipment:   ${method._equipmentId ?? ''}`,
          `Coffee:      ${params.coffee ?? ''}`,
          `Water:       ${params.water ?? ''}`,
          `Ratio:       ${params.ratio ?? ''}`,
          `Grind Size:  ${params.grindSize ?? ''}`,
          `Temperature: ${params.temp ?? ''}`,
        ];

        if (stages.length > 0) {
          lines.push('', 'Stages:');
          for (let i = 0; i < stages.length; i++) {
            const s = stages[i] as Record<string, unknown>;
            lines.push(
              `  ${i + 1}. ${s.label ?? ''} | ${s.pourType ?? ''} | ${s.water ?? ''} | ${s.duration ?? 0}s`,
            );
          }
        }

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
