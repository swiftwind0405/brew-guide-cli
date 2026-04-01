import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { executeUpsertBean } from '../../tools/upsertBean.ts';

function buildBeanData(args: Record<string, string | boolean | undefined>) {
  const beanData: Record<string, unknown> = {
    name: args.name,
    roaster: args.roaster,
    origin: args.origin,
    process: args.process,
  };

  if (typeof args.variety === 'string' && args.variety) {
    beanData.variety = args.variety;
  }
  if (typeof args['roast-level'] === 'string' && args['roast-level']) {
    beanData.roastLevel = args['roast-level'];
  }
  if (typeof args['roast-date'] === 'string' && args['roast-date']) {
    beanData.roastDate = args['roast-date'];
  }
  if (typeof args.price === 'string' && args.price) {
    beanData.price = args.price;
  }
  if (typeof args.capacity === 'string' && args.capacity) {
    beanData.capacity = args.capacity;
  }
  if (typeof args['bean-type'] === 'string' && args['bean-type']) {
    beanData.beanType = args['bean-type'];
  }
  if (typeof args.flavor === 'string' && args.flavor) {
    beanData.flavor = args.flavor
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof args.notes === 'string' && args.notes) {
    beanData.notes = args.notes;
  }

  return beanData;
}

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'add',
    description: 'Create a coffee bean record.',
  },
  args: {
    name: { type: 'string', required: true },
    roaster: { type: 'string', required: true },
    origin: { type: 'string', required: true },
    process: { type: 'string', required: true },
    variety: { type: 'string' },
    'roast-level': { type: 'string' },
    'roast-date': { type: 'string' },
    price: { type: 'string' },
    capacity: { type: 'string' },
    'bean-type': { type: 'string' },
    flavor: { type: 'string' },
    notes: { type: 'string' },
    'dry-run': { type: 'boolean' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const beanData = buildBeanData(args as Record<string, string | boolean | undefined>);
    const dryRun = args['dry-run'] === true;
    const jsonFormat = args.format === 'json';

    if (dryRun) {
      if (jsonFormat) {
        console.log(JSON.stringify({ dryRun: true, bean: beanData }));
        return;
      }

      console.log(`[dry-run] Would create bean:\n${JSON.stringify(beanData, null, 2)}`);
      return;
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const result = await executeUpsertBean(supabase, config, { bean: beanData });
      const text = result.content[0]?.text ?? '';

      if (/64 KB/i.test(text)) {
        exitWithError(text, 1);
      }

      if (/^Failed to upsert bean:/i.test(text)) {
        exitWithError(`Error: ${text}`, 65);
      }

      const match = text.match(/coffee bean (bean_[^\s]+) at ([^\.\n]+)/i);
      if (!match) {
        console.log(text);
        return;
      }

      const [, id, timestamp] = match;
      if (jsonFormat) {
        console.log(JSON.stringify({ id, status: 'created', timestamp }));
        return;
      }

      console.log(`Created bean ${id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/Missing|Config error/i.test(message)) {
        exitWithError(`Error: Config ${message}`, 64);
      }
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
