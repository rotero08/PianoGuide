// tests/server.mjs
// Starts an Astro server (`dev` or `preview`) on a free port for a test script and stops it again.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));

const freePort = () => new Promise((resolve) => {
  const probe = net.createServer().listen(0, '127.0.0.1', () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});

/**
 * Runs `astro <command>` and resolves once `readyPath` answers. `command` must be on the command
 * line as its own word: astro.config.mjs looks for `dev` there to decide how to run.
 */
export async function startAstro(command, readyPath = '/') {
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const astroDir = path.join(ROOT, 'node_modules/astro');
  const cli = path.join(astroDir, JSON.parse(fs.readFileSync(path.join(astroDir, 'package.json'), 'utf8')).bin.astro);
  // Its own process group, so that stopping it also stops the Workers runtime that `preview` starts.
  const server = spawn(process.execPath, [cli, command, '--port', String(port)], { cwd: ROOT, stdio: 'ignore', detached: true });
  const stop = () => {
    try {
      process.kill(-server.pid);
    } catch {
      // already gone
    }
  };
  for (let attempt = 0; ; attempt++) {
    const up = await fetch(origin + readyPath).then((response) => response.ok, () => false);
    if (up) return { origin, stop };
    if (attempt > 120 || server.exitCode !== null) {
      stop();
      throw new Error(`\`astro ${command}\` did not start within 60 seconds.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
