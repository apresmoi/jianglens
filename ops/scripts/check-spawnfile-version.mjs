#!/usr/bin/env node
import { assertSpawnfileVersion, REQUIRED_SPAWNFILE_VERSION } from "./lib/spawnfile-version.mjs";

const command = process.argv[2] ?? process.env.SPAWNFILE_BIN ?? "spawnfile";

try {
  const install = assertSpawnfileVersion(command);
  console.log(`Using spawnfile ${install.version} from ${install.cliPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(`Required minimum: ${REQUIRED_SPAWNFILE_VERSION}`);
  process.exit(1);
}
