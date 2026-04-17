import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { consumeBean } from '../../services/beans.ts';

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
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['bean', 'consume'], args as Record<string, unknown>);

    const amount = Number.parseFloat(String(args.amount));
    if (Number.isNaN(amount) || amount <= 0) {
      console.error('Error: --amount must be a positive number.');
      process.exit(2);
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

      if (args.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Consumed ${amount}g from ${result.name ?? args.id} — remaining: ${result.remaining}`);
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
