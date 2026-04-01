import { defineCommand } from 'citty';
import addCommand from './add.ts';
import listCommand from './list.ts';

export default defineCommand({
  meta: {
    name: 'bean',
    description: 'Manage coffee beans.',
  },
  subCommands: {
    add: addCommand,
    list: listCommand,
  },
});
