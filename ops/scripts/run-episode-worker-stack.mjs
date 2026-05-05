#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertSpawnfileVersion, REQUIRED_SPAWNFILE_VERSION } from "./lib/spawnfile-version.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "../..");

let mode = "detach";
for (const arg of process.argv.slice(2)) {
  if (arg === "--foreground") {
    mode = "foreground";
  } else if (arg === "-h" || arg === "--help") {
    console.log(`Usage: ops/scripts/run-episode-worker-stack.sh [--foreground]

Runs the episode-worker Docker stack with Moltnet hosted inside the container.

Environment:
  SPAWNFILE_BIN Spawnfile CLI. Default: spawnfile. Requires >= ${REQUIRED_SPAWNFILE_VERSION}
  IMAGE         Docker image tag. Default: jiang-lens-episode-worker:latest
  NAME          Container name. Default: jiang-lens-episode-worker
  PORT          Host port for Moltnet console/API. Default: 8787
  RUNTIME_DIR   Gitignored persisted runtime dir. Default: .runtime/episode-worker
  ENV_FILE      Local env file with GH_TOKEN. Default: ops/secrets/episode-worker.env
  AUTH_PROFILE  Spawnfile auth profile for Codex OAuth. Default: jiang-lens
  JIANG_LENS_REPO_DIR
                Absolute checkout path in the container. Default: PicoClaw workspace/jiang-lens
  EPISODE_WORKER_STATE_DIR
                Absolute durable worker state path in the container. Default: PicoClaw state/episode-worker
  PICOCLAW_AUTONOMY_ENABLED
                Set true to enable Picoclaw's built-in heartbeat. Default: false
  PICOCLAW_HEARTBEAT_INTERVAL_SECONDS
                Picoclaw built-in heartbeat interval. Default: 900
  EPISODE_WORKER_LOOP_ENABLED
                Set false to disable Virgil's direct autonomy loop. Default: true
  EPISODE_WORKER_LOOP_INTERVAL_SECONDS
                Seconds between Virgil autonomy checks/iterations. Default: 60
  EPISODE_WORKER_HEARTBEAT_INTERVAL_SECONDS
                Seconds between Virgil autonomy heartbeat writes while an iteration runs. Default: 30
  EPISODE_WORKER_LOOP_ONCE
                Set true to run one loop iteration, useful for debugging.
  LENS_STEWARD_LOOP_ENABLED
                Set false to disable Plato's direct autonomy loop. Default: true
  LENS_STEWARD_LOOP_INTERVAL_SECONDS
                Seconds between Plato autonomy checks/iterations. Default: 180
  LENS_STEWARD_HEARTBEAT_INTERVAL_SECONDS
                Seconds between Plato autonomy heartbeat writes. Default: 45
  LENS_STEWARD_LOOP_ONCE
                Set true to run one Plato loop iteration, useful for debugging.`);
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}`);
    process.exit(2);
  }
}

const image = process.env.IMAGE ?? "jiang-lens-episode-worker:latest";
const name = process.env.NAME ?? "jiang-lens-episode-worker";
const port = process.env.PORT ?? "8787";
const runtimeDir = process.env.RUNTIME_DIR ?? path.join(root, ".runtime", "episode-worker");
const envFile = process.env.ENV_FILE ?? path.join(root, "ops", "secrets", "episode-worker.env");
const authProfileName = process.env.AUTH_PROFILE ?? "jiang-lens";
const spawnOut = process.env.SPAWN_OUT ?? path.join(root, ".spawn", "episode-worker-build");
const spawnfileBin = process.env.SPAWNFILE_BIN ?? "spawnfile";
const defaultContainerRepoDir =
  "/var/lib/spawnfile/instances/picoclaw/agent-episode-worker/picoclaw/workspace/jiang-lens";
const defaultContainerStateDir =
  "/var/lib/spawnfile/instances/picoclaw/agent-episode-worker/picoclaw/state/episode-worker";
const defaultLensContainerRepoDir =
  "/var/lib/spawnfile/instances/picoclaw/agent-lens-steward/picoclaw/workspace/jiang-lens";
const defaultLensContainerStateDir =
  "/var/lib/spawnfile/instances/picoclaw/agent-lens-steward/picoclaw/state/lens-steward";

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const parseEnvFile = (file) => {
  const result = {};
  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const equals = line.indexOf("=");
    if (equals <= 0) {
      continue;
    }
    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: options.stdio ?? "inherit",
    env: process.env
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  return result;
};

const sleepSeconds = (seconds) => {
  spawnSync("sleep", [String(seconds)], { stdio: "ignore" });
};

const waitForMoltnet = () => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = spawnSync("curl", ["-fsS", `http://127.0.0.1:${port}/healthz`], {
      stdio: "ignore"
    });
    if (result.status === 0) {
      return true;
    }
    sleepSeconds(1);
  }
  return false;
};

const registerCodexOperator = () => {
  if (!waitForMoltnet()) {
    console.warn(`Moltnet on port ${port} did not become ready for codex-operator registration`);
    return;
  }

  const result = spawnSync(
    "moltnet",
    [
      "register-agent",
      "--base-url",
      `http://127.0.0.1:${port}`,
      "--agent",
      "codex-operator",
      "--name",
      "Codex Operator"
    ],
    { cwd: root, stdio: "ignore", env: process.env }
  );
  if (result.status !== 0) {
    console.warn("Could not register codex-operator with local Moltnet; room reads may still work, but sends can be harder to inspect.");
  }
};

if (!fs.existsSync(envFile)) {
  fail(
    [
      `Missing env file: ${envFile}`,
      "Create it with:",
      "  mkdir -p ops/secrets",
      "  cp ops/env/episode-worker.env.example ops/secrets/episode-worker.env",
      "  $EDITOR ops/secrets/episode-worker.env"
    ].join("\n")
  );
}

let spawnfileInstall;
try {
  spawnfileInstall = assertSpawnfileVersion(spawnfileBin);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const localEnv = parseEnvFile(envFile);
if (!localEnv.GH_TOKEN) {
  fail(`Missing GH_TOKEN in ${envFile}`);
}
for (const [key, value] of Object.entries(localEnv)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const containerRepoDir = process.env.JIANG_LENS_REPO_DIR ?? defaultContainerRepoDir;
if (!path.isAbsolute(containerRepoDir)) {
  fail(`JIANG_LENS_REPO_DIR must be an absolute container path, got: ${containerRepoDir}`);
}
const containerStateDir = process.env.EPISODE_WORKER_STATE_DIR ?? defaultContainerStateDir;
if (!path.isAbsolute(containerStateDir)) {
  fail(`EPISODE_WORKER_STATE_DIR must be an absolute container path, got: ${containerStateDir}`);
}
const lensContainerRepoDir = process.env.LENS_STEWARD_REPO_DIR ?? defaultLensContainerRepoDir;
if (!path.isAbsolute(lensContainerRepoDir)) {
  fail(`LENS_STEWARD_REPO_DIR must be an absolute container path, got: ${lensContainerRepoDir}`);
}
const lensContainerStateDir = process.env.LENS_STEWARD_STATE_DIR ?? defaultLensContainerStateDir;
if (!path.isAbsolute(lensContainerStateDir)) {
  fail(`LENS_STEWARD_STATE_DIR must be an absolute container path, got: ${lensContainerStateDir}`);
}
const runtimeRepoDir = path.join(runtimeDir, "repo");
const runtimeStateDir = path.join(runtimeDir, "state");
const runtimeLensRepoDir = path.join(runtimeDir, "lens-steward", "repo");
const runtimeLensStateDir = path.join(runtimeDir, "lens-steward", "state");

run("docker", ["image", "inspect", image], { stdio: "ignore" });

const listening = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
  encoding: "utf8"
});
if (listening.status === 0) {
  const existing = spawnSync(
    "docker",
    ["ps", "--filter", `name=^/${name}$`, "--format", "{{.ID}}"],
    { encoding: "utf8" }
  ).stdout.trim();
  if (!existing) {
    fail(`Port ${port} is already in use. Stop the host Moltnet server or choose PORT=...`);
  }
}

fs.mkdirSync(path.join(runtimeDir, "moltnet", "servers"), { recursive: true });
fs.mkdirSync(runtimeRepoDir, { recursive: true });
fs.mkdirSync(runtimeStateDir, { recursive: true });
fs.mkdirSync(runtimeLensRepoDir, { recursive: true });
fs.mkdirSync(runtimeLensStateDir, { recursive: true });

const existingContainerId = spawnSync(
  "docker",
  ["ps", "-a", "--filter", `name=^/${name}$`, "--format", "{{.ID}}"],
  { encoding: "utf8" }
).stdout.trim();

if (existingContainerId && !fs.existsSync(path.join(runtimeRepoDir, ".git"))) {
  const snapshotDir = `${runtimeRepoDir}.snapshot`;
  fs.rmSync(snapshotDir, { force: true, recursive: true });
  const copyResult = spawnSync(
    "docker",
    ["cp", `${name}:${containerRepoDir}`, snapshotDir],
    { cwd: root, stdio: "inherit", env: process.env }
  );
  if (copyResult.status === 0) {
    fs.rmSync(runtimeRepoDir, { force: true, recursive: true });
    fs.renameSync(snapshotDir, runtimeRepoDir);
  } else {
    fs.rmSync(snapshotDir, { force: true, recursive: true });
    fail(`Could not snapshot existing ${name} checkout from ${containerRepoDir}`);
  }
}

if (existingContainerId && !fs.existsSync(path.join(runtimeLensRepoDir, ".git"))) {
  const snapshotDir = `${runtimeLensRepoDir}.snapshot`;
  fs.rmSync(snapshotDir, { force: true, recursive: true });
  const copyResult = spawnSync(
    "docker",
    ["cp", `${name}:${lensContainerRepoDir}`, snapshotDir],
    { cwd: root, stdio: "ignore", env: process.env }
  );
  if (copyResult.status === 0) {
    fs.rmSync(runtimeLensRepoDir, { force: true, recursive: true });
    fs.renameSync(snapshotDir, runtimeLensRepoDir);
  } else {
    fs.rmSync(snapshotDir, { force: true, recursive: true });
  }
}

spawnSync("docker", ["rm", "-f", name], { stdio: "ignore" });

run(spawnfileBin, ["auth", "sync", root, "--profile", authProfileName, "--env-file", envFile], {
  stdio: "ignore"
});

const compiler = await import(pathToFileURL(path.join(spawnfileInstall.distPath, "compiler", "index.js")));
const auth = await import(pathToFileURL(path.join(spawnfileInstall.distPath, "auth", "index.js")));

const compileResult = await compiler.compileProject(root, {
  outputDirectory: spawnOut
});
const authProfile = await auth.requireAuthProfile(authProfileName);
const invocation = await compiler.createDockerRunInvocation(compileResult, image, {
  authProfile,
  containerName: name,
  detach: mode === "detach",
  envFilePath: envFile
});

const dockerArgs = [...invocation.args];
if (mode === "detach") {
  dockerArgs.splice(1, 0, "--restart", "unless-stopped");
}

for (const key of [
  "JIANG_LENS_REPO_URL",
  "JIANG_LENS_REPO_BRANCH",
  "JIANG_LENS_REPO_DIR",
  "PICOCLAW_AUTONOMY_ENABLED",
  "PICOCLAW_HEARTBEAT_INTERVAL_SECONDS",
  "EPISODE_WORKER_LOOP_ENABLED",
  "EPISODE_WORKER_LOOP_INTERVAL_SECONDS",
  "EPISODE_WORKER_HEARTBEAT_INTERVAL_SECONDS",
  "EPISODE_WORKER_LOOP_ONCE",
  "EPISODE_WORKER_LOOP_SESSION",
  "EPISODE_WORKER_STATE_DIR",
  "LENS_STEWARD_REPO_DIR",
  "LENS_STEWARD_STATE_DIR",
  "LENS_STEWARD_LOOP_ENABLED",
  "LENS_STEWARD_LOOP_INTERVAL_SECONDS",
  "LENS_STEWARD_HEARTBEAT_INTERVAL_SECONDS",
  "LENS_STEWARD_LOOP_ONCE",
  "LENS_STEWARD_LOOP_SESSION"
]) {
  if (process.env[key]) {
    dockerArgs.splice(dockerArgs.lastIndexOf(image), 0, "-e", `${key}=${process.env[key]}`);
  }
}

let mappedMoltnetPort = false;
for (let index = 0; index < dockerArgs.length - 1; index += 1) {
  if (dockerArgs[index] === "-p" && dockerArgs[index + 1].endsWith(":8787")) {
    dockerArgs[index + 1] = `127.0.0.1:${port}:8787`;
    mappedMoltnetPort = true;
  }
}

const imageIndex = dockerArgs.lastIndexOf(image);
if (imageIndex === -1) {
  fail(`Unable to locate image argument in generated Docker run invocation for ${image}`);
}

if (!mappedMoltnetPort) {
  dockerArgs.splice(imageIndex, 0, "-p", `127.0.0.1:${port}:8787`);
}
dockerArgs.splice(
  dockerArgs.lastIndexOf(image),
  0,
  "-v",
  `${path.join(runtimeDir, "moltnet", "servers")}:/var/lib/spawnfile/moltnet/servers`
);
dockerArgs.splice(
  dockerArgs.lastIndexOf(image),
  0,
  "-v",
  `${runtimeRepoDir}:${containerRepoDir}`
);
dockerArgs.splice(
  dockerArgs.lastIndexOf(image),
  0,
  "-v",
  `${runtimeStateDir}:${containerStateDir}`
);
dockerArgs.splice(
  dockerArgs.lastIndexOf(image),
  0,
  "-v",
  `${runtimeLensRepoDir}:${lensContainerRepoDir}`
);
dockerArgs.splice(
  dockerArgs.lastIndexOf(image),
  0,
  "-v",
  `${runtimeLensStateDir}:${lensContainerStateDir}`
);

run(invocation.command, dockerArgs, {
  stdio: "inherit"
});

if (mode === "detach") {
  registerCodexOperator();
  console.log(`Episode worker stack started: ${name}`);
  console.log(`Moltnet console: http://127.0.0.1:${port}/console/`);
  console.log(`Logs: docker logs -f ${name}`);
}
