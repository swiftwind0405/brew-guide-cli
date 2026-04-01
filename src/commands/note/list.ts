import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
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
      record.beanId,
      record.score,
      record.flavor,
      record.updated_at,
    ].filter(Boolean);
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
    format: { type: 'string' },
  },
  async run({ args }) {
    const limit = Number.parseInt(String(args.limit), 10);
    if (Number.isNaN(limit) || limit <= 0) {
      exitWithError('Error: --limit must be a positive integer', 2);
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const result = await executeListRecent(supabase, config, { table: 'brewing_notes', limit });
      const text = result.content[0]?.text ?? '';

      if (/^Failed to list records:/i.test(text)) {
        exitWithError(`Error: Network ${text}`, 65);
      }

      if (/^No records found in brewing_notes\./i.test(text)) {
        console.log("No notes found. Use 'brew-guide note add' to create one.");
        return;
      }

      const records = JSON.parse(text);
      if (args.format === 'json') {
        console.log(JSON.stringify(records));
        return;
      }

      printHumanRecords(records);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/Missing|Config error/i.test(message)) {
        exitWithError(`Error: Config ${message}`, 64);
      }
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
