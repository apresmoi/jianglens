import { accessSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const websiteDir = path.join(repoRoot, 'website');
const astroBin = path.join(
  websiteDir,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'astro.cmd' : 'astro',
);

if (existsSync(astroBin)) {
  process.exit(0);
}

function isWritable(dir) {
  if (!dir) return false;
  try {
    accessSync(dir);
    accessSync(dir, 2);
    return true;
  } catch {
    return false;
  }
}

let home = process.env.HOME;
if (!isWritable(home)) {
  const spawnfileHome = '/home/spawnfile';
  home = isWritable(spawnfileHome) ? spawnfileHome : path.join(repoRoot, '.cache', 'home');
}

const npmCache = process.env.NPM_CONFIG_CACHE || path.join(home, '.npm');
mkdirSync(home, { recursive: true });
mkdirSync(npmCache, { recursive: true });

console.log('Website dependencies are missing; running npm ci in website/.');
const result = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], {
  cwd: websiteDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    HOME: home,
    NPM_CONFIG_CACHE: npmCache,
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (!existsSync(astroBin)) {
  console.error(`Expected Astro binary was not created at ${astroBin}`);
  process.exit(1);
}
