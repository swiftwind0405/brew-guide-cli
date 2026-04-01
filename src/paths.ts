import os from 'node:os';
import path from 'node:path';

export function getConfigPath() {
  const homeDir = process.env.HOME ?? os.homedir();

  return process.env.BREW_GUIDE_CONFIG_PATH
    ?? path.join(homeDir, '.config', 'brew-guide', 'config.json');
}
