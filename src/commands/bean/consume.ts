import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { consumeBean } from '../../services/beans.ts';
import { executeUpsertNote } from '../../tools/upsertNote.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'consume',
    description: 'Deduct coffee from a bean\'s remaining capacity.',
  },
  args: {
    id: { type: 'positional', required: true, description: 'Bean record ID.' },
    amount: { type: 'string', required: true, description: 'Grams to deduct (e.g., 15).' },
    'with-note': { type: 'boolean', description: 'Also create a quick-decrement brewing note.' },
    source: { type: 'string', description: 'Source tag for the note (default: quick-decrement).' },
    'dry-run': { type: 'boolean', description: 'Preview the operation without executing.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['bean', 'consume'], args as Record<string, unknown>);

    const amount = Number.parseFloat(String(args.amount));
    if (Number.isNaN(amount) || amount <= 0) {
      console.error('Error: --amount must be a positive number.');
      process.exit(2);
    }

    const source = typeof args.source === 'string' && args.source ? args.source : 'quick-decrement';
    const withNote = args['with-note'] === true;

    if (args['dry-run']) {
      const preview: Record<string, unknown> = { dryRun: true, action: 'consume', id: args.id, amount };
      if (withNote) preview.note = { beanId: args.id, source, coffee: `${amount}g` };
      if (args.format === 'json') {
        console.log(JSON.stringify(preview));
      } else {
        console.log(`[dry-run] Would consume ${amount}g from bean ${args.id.slice(0, 8)}${withNote ? ` and write ${source} note` : ''}`);
      }
      await logger.success();
      return;
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const result = await consumeBean(supabase, args.id, amount, config.brewGuideUserId);

      if (!result) {
        console.error(`Bean ${args.id} not found.`);
        await logger.error(`Bean ${args.id} not found`);
        process.exit(1);
      }

      if (withNote) {
        await executeUpsertNote(supabase, config, {
          note: {
            beanId: args.id,
            source,
            rating: 0,
            params: { coffee: `${amount}g` },
          },
        });
      }

      if (args.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Consumed ${amount}g from ${result.name ?? args.id} — remaining: ${result.remaining}${withNote ? ` (${source} note recorded)` : ''}`);
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
