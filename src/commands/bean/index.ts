import { defineCommand } from 'citty';
import addCommand from './add.ts';
import consumeCommand from './consume.ts';
import deleteCommand from './delete.ts';
import getCommand from './get.ts';
import listCommand from './list.ts';
import updateCommand from './update.ts';

export default defineCommand({
  meta: {
    name: 'bean',
    description: 'Manage coffee beans.',
  },
  subCommands: {
    add: addCommand,
    list: listCommand,
    get: getCommand,
    update: updateCommand,
    delete: deleteCommand,
    consume: consumeCommand,
  },
});
