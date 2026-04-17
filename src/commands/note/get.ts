import { defineCommand } from 'citty';
import { createSupabaseClient } from '../../client.ts';
import { resolveConfig } from '../../config.ts';
import { createCommandLogger } from '../../logger.ts';
import { getNote } from '../../services/notes.ts';

function exitWithError(message: string, code: number) {
  console.error(message);
  process.exit(code);
}

export default defineCommand({
  meta: {
    name: 'get',
    description: 'Show details for a specific brewing note.',
  },
  args: {
    id: { type: 'positional', required: true, description: 'Note record ID.' },
    format: { type: 'string' },
  },
  async run({ args }) {
    const logger = createCommandLogger(['note', 'get'], args as Record<string, unknown>);

    try {
      const config = await resolveConfig();
      const supabase = createSupabaseClient(config);
      const note = await getNote(supabase, args.id, config.brewGuideUserId);

      if (!note) {
        console.error(`Note ${args.id} not found.`);
        await logger.error(`Note ${args.id} not found`);
        process.exit(1);
      }

      if (args.format === 'json') {
        console.log(JSON.stringify(note, null, 2));
      } else {
        const params = (note.params ?? {}) as Record<string, unknown>;
        const taste = (note.taste ?? {}) as Record<string, unknown>;
        const beanInfo = (note.coffeeBeanInfo ?? {}) as Record<string, unknown>;
        const tasteStr = Object.keys(taste).length > 0
          ? Object.entries(taste).map(([k, v]) => `${k}:${v}`).join(', ')
          : '-';
        const lines = [
          `ID:          ${note.id}`,
          `Equipment:   ${note.equipment ?? ''}`,
          `Method:      ${note.method ?? ''}`,
          `Coffee:      ${params.coffee ?? ''}`,
          `Water:       ${params.water ?? ''}`,
          `Ratio:       ${params.ratio ?? ''}`,
          `Grind Size:  ${params.grindSize ?? ''}`,
          `Temperature: ${params.temp ?? ''}`,
          `Rating:      ${note.rating ?? '-'}`,
          `Taste:       ${tasteStr}`,
          `Bean:        ${beanInfo.name ?? ''}`,
          `Notes:       ${note.notes ?? ''}`,
        ];
        console.log(lines.join('\n'));
      }

      await logger.success();
    } catch (error) {
      await logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      exitWithError(`Error: ${message}`, 1);
    }
  },
});
