import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { executeListRecent } from '../../tools/listRecent.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

function printHumanRecords(records: Array<Record<string, unknown>>) {
  for (const record of records) {
    const fields = [
      record.id,
      record.method,
      record.equipment,
      record.beanId,
      record.rating ?? record.score,
      record.notes ?? record.flavor,
      record.updated_at,
    ].filter((v) => v !== undefined && v !== null && v !== '');
    console.log(fields.join(' | '));
  }
}

export default defineCommand({
  meta: {
    name: 'list',
    description: 'List brewing notes.',
  },
  args: {
    limit: { type: 'string', default: '20' },
    equipment: { type: 'string', description: 'Filter by equipment id.' },
    method: { type: 'string', description: 'Filter by method name (substring, case-insensitive).' },
    'bean-id': { type: 'string', description: 'Filter by bean id.' },
    'min-rating': { type: 'string', description: 'Only notes with rating >= N (0-5).' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['note', 'list'], args as Record<string, unknown>);
    const limit = Number.parseInt(String(args.limit), 10);
    if (Number.isNaN(limit) || limit <= 0) {
      await logger.error('Error: --limit must be a positive integer');
      exitWithError('Error: --limit must be a positive integer', 2);
    }

    let minRating: number | undefined;
    if (typeof args['min-rating'] === 'string' && args['min-rating']) {
      const n = Number.parseFloat(args['min-rating']);
      if (!Number.isFinite(n) || n < 0 || n > 5) {
        exitWithError('Error: --min-rating must be a number between 0 and 5.', 2);
      }
      minRating = n;
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const result = await executeListRecent(supabase, config, { table: 'brewing_notes', limit });
      const text = result.content[0]?.text ?? '';

      if (/^Failed to list records:/i.test(text)) {
        await logger.error(text);
        exitWithError(`Error: Network ${text}`, 65);
      }

      if (/^No records found in brewing_notes\./i.test(text)) {
        console.log("No notes found. Use 'brew-guide note add' to create one.");
        await logger.success();
        return;
      }

      const records: Array<Record<string, unknown>> = JSON.parse(text);

      const filtered = records.filter((r) => {
        if (typeof args.equipment === 'string' && args.equipment && r.equipment !== args.equipment) return false;
        if (typeof args.method === 'string' && args.method) {
          const m = typeof r.method === 'string' ? r.method.toLowerCase() : '';
          if (!m.includes(args.method.toLowerCase())) return false;
        }
        if (typeof args['bean-id'] === 'string' && args['bean-id'] && r.beanId !== args['bean-id']) return false;
        if (minRating != null) {
          const rating = typeof r.rating === 'number' ? r.rating : 0;
          if (rating < minRating) return false;
        }
        return true;
      });

      if (args.format === 'json') {
        console.log(JSON.stringify(filtered));
        await logger.success();
        return;
      }

      printHumanRecords(filtered);
      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      if (/Missing|Config error/i.test(message)) {
        exitWithError(`Error: Config ${message}`, 64);
      }
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
