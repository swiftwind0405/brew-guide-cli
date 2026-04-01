import { spawn, spawnSync } from 'node:child_process';

export function spawnCli(args, options = {}) {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/main.ts', ...args], {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: 'pipe',
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (chunk) => {
    stdout += String(chunk);
  });
  child.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });

  const completion = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code, signal) => {
      resolve({ code, signal, stdout, stderr });
    });
  });

  return { child, completion };
}

export async function runInteractiveCli(args, options = {}) {
  const { child, completion } = spawnCli(args, options);

  for (const line of options.inputLines ?? []) {
    child.stdin.write(`${line}\n`);
  }

  if (options.closeStdin !== false) {
    child.stdin.end();
  }

  return completion;
}

export function runCliSync(args, options = {}) {
  return spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts', ...args], {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env ?? {}) },
    encoding: 'utf8',
  });
}
