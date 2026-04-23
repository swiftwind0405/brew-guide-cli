import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { updateEquipment } from '../../services/equipment.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'update',
    description: 'Update equipment fields.',
  },
  args: {
    id: { type: 'positional', required: true, description: 'Equipment ID.' },
    name: { type: 'string', description: 'Equipment name.' },
    note: { type: 'string', description: 'Note about the equipment.' },
    'animation-type': { type: 'string', description: 'Animation type: v60 / kalita / origami / clever / custom / espresso.' },
    'has-valve': { type: 'string', description: 'Has valve: true or false.' },
    'dry-run': { type: 'boolean', description: 'Preview the operation without executing.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['equipment', 'update'], args as Record<string, unknown>);

    const updates: Record<string, unknown> = {};
    if (typeof args.name === 'string') updates.name = args.name;
    if (typeof args.note === 'string') updates.note = args.note;
    if (typeof args['animation-type'] === 'string' && args['animation-type']) {
      const allowed = ['v60', 'kalita', 'origami', 'clever', 'custom', 'espresso'];
      if (!allowed.includes(args['animation-type'])) {
        console.error(`Error: --animation-type must be one of ${allowed.join(', ')}.`);
        process.exit(2);
      }
      updates.animationType = args['animation-type'];
    }
    if (typeof args['has-valve'] === 'string' && args['has-valve']) {
      const v = args['has-valve'].toLowerCase();
      if (v !== 'true' && v !== 'false') {
        console.error('Error: --has-valve must be "true" or "false".');
        process.exit(2);
      }
      updates.hasValve = v === 'true';
    }

    if (Object.keys(updates).length === 0) {
      console.error('No fields to update. Use --name, --note, --animation-type, --has-valve.');
      process.exit(2);
    }

    if (args['dry-run']) {
      if (args.format === 'json') {
        console.log(JSON.stringify({ dryRun: true, action: 'update', id: args.id, updates }));
      } else {
        console.log(`[dry-run] Would update equipment ${args.id.slice(0, 8)}:\n${JSON.stringify(updates, null, 2)}`);
      }
      await logger.success();
      return;
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const result = await updateEquipment(supabase, args.id, updates, config.brewGuideUserId);

      if (!result) {
        console.error(`Equipment ${args.id} not found.`);
        await logger.error(`Equipment ${args.id} not found`);
        process.exit(1);
      }

      if (args.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Updated equipment: ${result.name ?? args.id}`);
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
