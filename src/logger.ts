import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

type CommandLogStatus = 'success' | 'error';

export interface CommandLogEntry {
  command: string[];
  args: Record<string, unknown>;
  status: CommandLogStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  error?: string;
}

function getLogPath() {
  return process.env.BREW_GUIDE_LOG_PATH || path.join(os.homedir(), '.config', 'brew-guide', 'commands.log');
}

function sanitizeArgs(args: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(args).map(([key, value]) => {
      if (/key|token|secret|password/i.test(key)) {
        return [key, '[REDACTED]'];
      }
      return [key, value];
    }),
  );
}

async function appendJsonLine(filePath: string, line: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${line}\n`, 'utf8');
}

export async function logCommandUsage(entry: CommandLogEntry) {
  try {
    const filePath = getLogPath();
    const payload = {
      ...entry,
      args: sanitizeArgs(entry.args),
      pid: process.pid,
    };
    await appendJsonLine(filePath, JSON.stringify(payload));
  } catch {
    // logging must never break the CLI
  }
}

export function createCommandLogger(command: string[], args: Record<string, unknown>) {
  const startedAt = new Date();

  return {
    async success() {
      const finishedAt = new Date();
      await logCommandUsage({
        command,
        args,
        status: 'success',
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      });
    },
    async error(error: unknown) {
      const finishedAt = new Date();
      const message = error instanceof Error ? error.message : String(error);
      await logCommandUsage({
        command,
        args,
        status: 'error',
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        error: message,
      });
    },
  };
}
