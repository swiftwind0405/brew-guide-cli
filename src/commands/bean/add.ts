import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { executeUpsertBean } from '../../tools/upsertBean.ts';

function normalizeWeight(value: string | undefined) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, '').replace(/(g|G|克)$/u, '');
  return normalized || undefined;
}

function buildBeanData(args: Record<string, string | boolean | undefined>) {
  const normalizedCapacity = normalizeWeight(args.capacity);

  const beanData: Record<string, unknown> = {
    name: args.name,
    roaster: args.roaster,
    origin: args.origin,
    process: args.process,
  };

  const blendComponent: Record<string, unknown> = {
    origin: args.origin,
    process: args.process,
  };

  if (typeof args.estate === 'string' && args.estate) {
    blendComponent.estate = args.estate;
  }

  if (typeof args.variety === 'string' && args.variety) {
    beanData.variety = args.variety;
    blendComponent.variety = args.variety;
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
  if (typeof normalizedCapacity === 'string' && normalizedCapacity) {
    beanData.capacity = normalizedCapacity;
  }
  beanData.beanType = typeof args['bean-type'] === 'string' && args['bean-type'] ? args['bean-type'] : 'filter';
  if (typeof args.flavor === 'string' && args.flavor) {
    beanData.flavor = args.flavor
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof args.notes === 'string' && args.notes) {
    beanData.notes = args.notes;
  }

  beanData.blendComponents = [blendComponent];
  beanData.beanState = 'roasted';
  beanData.isFrozen = false;
  beanData.startDay = 30;
  beanData.endDay = 60;

  if (typeof normalizedCapacity === 'string' && normalizedCapacity) {
    beanData.remaining = normalizedCapacity;
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
    estate: { type: 'string' },
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
    const logger = createCommandLogger(['bean', 'add'], args as Record<string, unknown>);
    const beanData = buildBeanData(args as Record<string, string | boolean | undefined>);
    const dryRun = args['dry-run'] === true;
    const jsonFormat = args.format === 'json';

    if (dryRun) {
      if (jsonFormat) {
        console.log(JSON.stringify({ dryRun: true, bean: beanData }));
        await logger.success();
        return;
      }

      console.log(`[dry-run] Would create bean:\n${JSON.stringify(beanData, null, 2)}`);
      await logger.success();
      return;
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const result = await executeUpsertBean(supabase, config, { bean: beanData });
      const text = result.content[0]?.text ?? '';

      if (/64 KB/i.test(text)) {
        await logger.error(text);
        exitWithError(text, 1);
      }

      if (/^Failed to upsert bean:/i.test(text)) {
        await logger.error(text);
        exitWithError(`Error: ${text}`, 65);
      }

      const match = text.match(/coffee bean (bean_[^\s]+) at ([^\.\n]+)/i);
      if (!match) {
        console.log(text);
        await logger.success();
        return;
      }

      const [, id, timestamp] = match;
      if (jsonFormat) {
        console.log(JSON.stringify({ id, status: 'created', timestamp }));
        await logger.success();
        return;
      }

      console.log(`Created bean ${id}`);
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
