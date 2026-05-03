import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const REQUIRED_SPAWNFILE_VERSION = "0.1.4";

const parseVersion = (version) =>
  version
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));

const compareVersions = (left, right) => {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart > rightPart) {
      return 1;
    }
    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
};

const resolveCommandPath = (command) => {
  if (command.includes("/") && fs.existsSync(command)) {
    return fs.realpathSync(command);
  }

  return fs.realpathSync(execFileSync("which", [command], { encoding: "utf8" }).trim());
};

export const resolveSpawnfileInstall = (command = "spawnfile") => {
  const cliPath = resolveCommandPath(command);
  const distPath = path.resolve(path.dirname(cliPath), "..");
  const packagePath = path.resolve(distPath, "..", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  return {
    cliPath,
    command,
    distPath,
    packagePath,
    version: packageJson.version
  };
};

export const assertSpawnfileVersion = (command = "spawnfile") => {
  const install = resolveSpawnfileInstall(command);

  if (compareVersions(install.version, REQUIRED_SPAWNFILE_VERSION) < 0) {
    throw new Error(
      [
        `Spawnfile ${REQUIRED_SPAWNFILE_VERSION} or newer is required.`,
        `Found ${install.version} at ${install.cliPath}.`,
        `Install it with: npm install -g spawnfile@${REQUIRED_SPAWNFILE_VERSION}`,
        "Or set SPAWNFILE_BIN=/path/to/spawnfile."
      ].join("\n")
    );
  }

  return install;
};
