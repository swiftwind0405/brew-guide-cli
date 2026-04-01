import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { executeUpsertNote } from '../../tools/upsertNote.ts';

function buildNoteData(args: Record<string, string | boolean | undefined>) {
  const noteData: Record<string, unknown> = {
    beanId: args['bean-id'],
    method: args.method,
  };

  if (typeof args['grind-size'] === 'string' && args['grind-size']) {
    noteData.grindSize = args['grind-size'];
  }
  if (typeof args['water-temp'] === 'string' && args['water-temp']) {
    noteData.waterTemp = Number(args['water-temp']);
  }
  if (typeof args.ratio === 'string' && args.ratio) {
    noteData.ratio = args.ratio;
  }
  if (typeof args['brew-time'] === 'string' && args['brew-time']) {
    noteData.brewTime = args['brew-time'];
  }
  if (typeof args.flavor === 'string' && args.flavor) {
    noteData.flavor = args.flavor;
  }
  if (typeof args.score === 'string' && args.score) {
    noteData.score = Number(args.score);
  }
  if (typeof args.memo === 'string' && args.memo) {
    noteData.memo = args.memo;
  }
  if (typeof args['brewed-at'] === 'string' && args['brewed-at']) {
    noteData.brewedAt = args['brewed-at'];
  }

  return noteData;
}

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'add',
    description: 'Create a brewing note record.',
  },
  args: {
    'bean-id': { type: 'string', required: true },
    method: { type: 'string', required: true },
    'grind-size': { type: 'string' },
    'water-temp': { type: 'string' },
    ratio: { type: 'string' },
    'brew-time': { type: 'string' },
    flavor: { type: 'string' },
    score: { type: 'string' },
    memo: { type: 'string' },
    'brewed-at': { type: 'string' },
    'dry-run': { type: 'boolean' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['note', 'add'], args as Record<string, unknown>);
    const noteData = buildNoteData(args as Record<string, string | boolean | undefined>);
    const dryRun = args['dry-run'] === true;
    const jsonFormat = args.format === 'json';

    if (dryRun) {
      if (jsonFormat) {
        console.log(JSON.stringify({ dryRun: true, note: noteData }));
        await logger.success();
        return;
      }

      console.log(`[dry-run] Would create note:\n${JSON.stringify(noteData, null, 2)}`);
      await logger.success();
      return;
    }

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const result = await executeUpsertNote(supabase, config, { note: noteData });
      const text = result.content[0]?.text ?? '';

      if (/64 KB/i.test(text)) {
        await logger.error(text);
        exitWithError(text, 1);
      }

      if (/^Failed to upsert note:/i.test(text)) {
        await logger.error(text);
        exitWithError(`Error: ${text}`, 65);
      }

      const match = text.match(/brewing note (note_[^\s]+) at ([^\.\n]+)/i);
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

      console.log(`Created note ${id}`);
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
