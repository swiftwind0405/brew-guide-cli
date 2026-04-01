import { defineCommand, runMain } from 'citty';
import packageJson from '../package.json' with { type: 'json' };
import beanCommand from './commands/bean/index.ts';
import initCommand from './commands/init.ts';
import noteCommand from './commands/note/index.ts';
import roastersCommand from './commands/roasters.ts';

const main = defineCommand({
  meta: {
    name: 'brew-guide',
    version: packageJson.version,
    description: 'CLI for operating brew-guide data in Supabase.',
  },
  subCommands: {
    init: initCommand,
    bean: beanCommand,
    note: noteCommand,
    roasters: roastersCommand,
  },
});

runMain(main);
