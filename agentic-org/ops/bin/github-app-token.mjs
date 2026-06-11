#!/usr/bin/env node
import { createSign } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const TOKEN_SAFETY_WINDOW_MS = 120_000;

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function readPrivateKey() {
  if (process.env.GITHUB_APP_PRIVATE_KEY_B64) {
    return Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY_B64, "base64").toString("utf8");
  }
  if (process.env.GITHUB_APP_PRIVATE_KEY) {
    return process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n");
  }
  if (process.env.GITHUB_APP_PRIVATE_KEY_PATH) {
    return readFile(process.env.GITHUB_APP_PRIVATE_KEY_PATH, "utf8");
  }
  throw new Error(
    "Missing GitHub App private key. Set GITHUB_APP_PRIVATE_KEY_B64, GITHUB_APP_PRIVATE_KEY, or GITHUB_APP_PRIVATE_KEY_PATH."
  );
}

function cachePath() {
  if (process.env.GITHUB_APP_TOKEN_CACHE) {
    return process.env.GITHUB_APP_TOKEN_CACHE;
  }
  return path.join(process.env.HOME || os.tmpdir(), ".cache", "jiang-lens", "github-app-token.json");
}

async function readCachedToken(filePath) {
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8"));
    const expiresAt = Date.parse(parsed.expires_at || "");
    if (parsed.token && Number.isFinite(expiresAt) && expiresAt - Date.now() > TOKEN_SAFETY_WINDOW_MS) {
      return parsed.token;
    }
  } catch {
    return null;
  }
  return null;
}

async function writeCachedToken(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(payload, null, 2) + "\n", { mode: 0o600 });
}

async function createJwt() {
  const issuer = process.env.GITHUB_APP_ID || process.env.GITHUB_APP_CLIENT_ID;
  if (!issuer) {
    throw new Error("Missing GITHUB_APP_ID.");
  }

  const privateKey = await readPrivateKey();
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iat: nowSeconds() - 60,
    exp: nowSeconds() + 540,
    iss: issuer
  };
  const body = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = createSign("RSA-SHA256").update(body).sign(privateKey);
  return `${body}.${base64url(signature)}`;
}

async function resolveInstallationId(jwt) {
  if (process.env.GITHUB_APP_INSTALLATION_ID) {
    return process.env.GITHUB_APP_INSTALLATION_ID;
  }

  const targetAccount = (process.env.GITHUB_APP_INSTALLATION_ACCOUNT || "apresmoi").toLowerCase();
  const response = await fetch("https://api.github.com/app/installations", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${jwt}`,
      "User-Agent": "jiang-lens-agents",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub App installation lookup failed: ${response.status} ${body}`);
  }

  const installations = await response.json();
  if (!Array.isArray(installations) || installations.length === 0) {
    throw new Error("GitHub App has no installations. Install it on apresmoi/jianglens first.");
  }

  const match = installations.find((installation) => {
    const login = installation?.account?.login;
    return typeof login === "string" && login.toLowerCase() === targetAccount;
  });
  if (match?.id) {
    return String(match.id);
  }
  if (installations.length === 1 && installations[0]?.id) {
    return String(installations[0].id);
  }

  const accounts = installations
    .map((installation) => installation?.account?.login)
    .filter(Boolean)
    .join(", ");
  throw new Error(`Could not find GitHub App installation for ${targetAccount}. Seen: ${accounts}`);
}

async function fetchInstallationToken() {
  const jwt = await createJwt();
  const installationId = await resolveInstallationId(jwt);
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "User-Agent": "jiang-lens-agents",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: "{}"
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub App token request failed: ${response.status} ${body}`);
  }
  const token = await response.json();
  if (!token.token || !token.expires_at) {
    throw new Error("GitHub App token response did not include token and expires_at.");
  }
  return token;
}

async function token() {
  const filePath = cachePath();
  const cached = await readCachedToken(filePath);
  if (cached) {
    return cached;
  }

  const fresh = await fetchInstallationToken();
  await writeCachedToken(filePath, fresh);
  return fresh.token;
}

try {
  const value = await token();
  if (process.argv.includes("--credential")) {
    process.stdout.write(`username=x-access-token\npassword=${value}\n`);
  } else {
    process.stdout.write(`${value}\n`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
