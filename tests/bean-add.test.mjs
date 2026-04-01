import assert from 'node:assert/strict';
import test from 'node:test';

import { runCliSync } from './helpers/cli.mjs';

function getOfflineEnv() {
  return {
    BREW_GUIDE_SUPABASE_URL: '',
    BREW_GUIDE_SUPABASE_SERVICE_ROLE_KEY: '',
    BREW_GUIDE_USER_ID: '',
  };
}

test('brew-guide bean add --dry-run prints a preview without credentials', () => {
  const result = runCliSync([
    'bean',
    'add',
    '--name',
    'X',
    '--roaster',
    'R',
    '--origin',
    'O',
    '--process',
    'P',
    '--dry-run',
  ], {
    env: getOfflineEnv(),
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /\[dry-run\]/i);
  assert.match(result.stdout, /"name": "X"/);
  assert.match(result.stdout, /"roaster": "R"/);
});

test('brew-guide bean add --dry-run --format json returns a structured preview', () => {
  const result = runCliSync([
    'bean',
    'add',
    '--name',
    'X',
    '--roaster',
    'R',
    '--origin',
    'O',
    '--process',
    'P',
    '--dry-run',
    '--format',
    'json',
  ], {
    env: getOfflineEnv(),
  });

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.dryRun, true);
  assert.equal(payload.bean.name, 'X');
  assert.equal(payload.bean.process, 'P');
});

test('brew-guide bean add fails when required arguments are missing', () => {
  const result = runCliSync(['bean', 'add', '--name', 'Ethiopia', '--roaster', 'R'], {
    env: getOfflineEnv(),
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stderr}${result.stdout}`, /Missing required argument: --origin/i);
});

test('brew-guide bean add can write to real Supabase when credentials are available', { skip: !process.env.BREW_GUIDE_SUPABASE_URL }, () => {
  const result = runCliSync([
    'bean',
    'add',
    '--name',
    'Test Bean',
    '--roaster',
    'Test',
    '--origin',
    'Test',
    '--process',
    'washed',
  ]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Created bean bean_/);
});
