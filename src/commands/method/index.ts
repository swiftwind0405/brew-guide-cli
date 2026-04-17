import { defineCommand } from 'citty';
import addCommand from './add.ts';
import deleteCommand from './delete.ts';
import getCommand from './get.ts';
import listCommand from './list.ts';
import updateCommand from './update.ts';

export default defineCommand({
  meta: {
    name: 'method',
    description: 'Manage brewing methods / recipes.',
  },
  subCommands: {
    list: listCommand,
    get: getCommand,
    add: addCommand,
    update: updateCommand,
    delete: deleteCommand,
  },
});
