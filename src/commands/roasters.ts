import { defineCommand } from 'citty';
import { createSupabaseClient } from '../client.ts';
import { resolveConfig } from '../config.ts';
import { executeGetAllRoasters } from '../tools/getAllRoasters.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

function parseRoasters(text: string) {
  if (/^No roasters found\./i.test(text)) {
    return [];
  }

  const [, body = ''] = text.split(':\n', 2);
  return body
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default defineCommand({
  meta: {
    name: 'roasters',
    description: 'List all roasters.',
  },
  args: {
    format: { type: 'string' },
  },
  async run({ args }) {
    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const result = await executeGetAllRoasters(supabase);
      const text = result.content[0]?.text ?? '';

      if (/^Failed to get roasters:/i.test(text)) {
        exitWithError(`Error: Network ${text}`, 65);
      }

      const roasters = parseRoasters(text);
      if (roasters.length === 0) {
        console.log('No roasters found. Add beans with --roaster to see them here.');
        return;
      }

      if (args.format === 'json') {
        console.log(JSON.stringify(roasters));
        return;
      }

      for (const roaster of roasters) {
        console.log(roaster);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/Missing|Config error/i.test(message)) {
        exitWithError(`Error: Config ${message}`, 64);
      }
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
