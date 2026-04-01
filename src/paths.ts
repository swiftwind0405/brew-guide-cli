import os from 'node:os';
import path from 'node:path';

export function getConfigPath() {
  return process.env.BREW_GUIDE_CONFIG_PATH
    ?? path.join(os.homedir(), '.config', 'brew-guide', 'config.json');
}
