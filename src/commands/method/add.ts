import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { addMethod } from '../../services/methods.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'add',
    description: 'Add a new brewing method to an equipment.',
  },
  args: {
    'equipment-id': { type: 'string', required: true, description: 'Equipment ID to add method to.' },
    name: { type: 'string', required: true, description: 'Method name.' },
    coffee: { type: 'string', default: '', description: 'Coffee amount.' },
    water: { type: 'string', default: '', description: 'Water amount.' },
    ratio: { type: 'string', default: '', description: 'Brew ratio.' },
    'grind-size': { type: 'string', default: '', description: 'Grind size.' },
    temp: { type: 'string', default: '', description: 'Water temperature.' },
    'stages-json': { type: 'string', description: 'Stages as JSON array.' },
    'dry-run': { type: 'boolean', description: 'Preview the operation without executing.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['method', 'add'], args as Record<string, unknown>);

    let stages: unknown[] = [];
    if (typeof args['stages-json'] === 'string' && args['stages-json']) {
      try {
        stages = JSON.parse(args['stages-json']);
      } catch {
        console.error('Error: --stages-json must be a valid JSON array.');
        process.exit(2);
      }
    }

    const methodData = {
      equipmentId: args['equipment-id'],
      name: args.name,
      params: {
        coffee: args.coffee ?? '',
        water: args.water ?? '',
        ratio: args.ratio ?? '',
        grindSize: args['grind-size'] ?? '',
        temp: args.temp ?? '',
        stages,
      },
    };

    if (args['dry-run']) {
      if (args.format === 'json') {
        console.log(JSON.stringify({ dryRun: true, method: methodData }));
      } else {
        console.log(`[dry-run] Would add method:\n${JSON.stringify(methodData, null, 2)}`);
      }
      await logger.success();
      return;
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const result = await addMethod(
        supabase,
        args['equipment-id'],
        args.name,
        methodData.params,
        config.brewGuideUserId,
      );

      if (args.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Added method: ${result.name} (ID: ${String(result.id).slice(0, 8)})`);
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
