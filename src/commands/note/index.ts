import { defineCommand } from 'citty';
import addCommand from './add.ts';
import listCommand from './list.ts';

export default defineCommand({
  meta: {
    name: 'note',
    description: 'Manage brewing notes.',
  },
  subCommands: {
    add: addCommand,
    list: listCommand,
  },
});
