import assert from 'node:assert/strict';
import test from 'node:test';

import { runCliSync } from './helpers/cli.mjs';

const hasSupabase = Boolean(process.env.BREW_GUIDE_SUPABASE_URL);

test(
  'brew-guide roasters --format json outputs an array of strings',
  { skip: !hasSupabase },
  () => {
    const result = runCliSync(['roasters', '--format', 'json']);

    assert.equal(result.status, 0);
    const payload = JSON.parse(result.stdout);
    assert.equal(Array.isArray(payload), true);
    assert.equal(payload.every((entry) => typeof entry === 'string'), true);
  },
);

test(
  'brew-guide roasters prints roasters or an empty-state message when Supabase credentials are available',
  { skip: !hasSupabase },
  () => {
    const result = runCliSync(['roasters']);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /.+/s);
  },
);

test('brew-guide roasters exits 64 when config is missing', () => {
  const result = runCliSync(['roasters'], {
    env: {
      BREW_GUIDE_SUPABASE_URL: '',
      BREW_GUIDE_SUPABASE_SERVICE_ROLE_KEY: '',
      BREW_GUIDE_USER_ID: '',
      BREW_GUIDE_CONFIG_PATH: '/tmp/does-not-exist-config.json',
    },
  });

  assert.equal(result.status, 64);
  assert.match(result.stderr, /Error: Config/i);
});
