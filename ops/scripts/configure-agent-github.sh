#!/usr/bin/env bash
set -euo pipefail

if [ -z "${GH_TOKEN:-}" ]; then
  echo "Missing GH_TOKEN. Provide a GitHub token at container runtime, not at image build time." >&2
  exit 1
fi

command -v git >/dev/null || {
  echo "Missing git in PATH" >&2
  exit 1
}

command -v gh >/dev/null || {
  echo "Missing gh in PATH" >&2
  exit 1
}

git config --global user.name "${GIT_AUTHOR_NAME:-Jiang Lens Episode Worker}"
git config --global user.email "${GIT_AUTHOR_EMAIL:-episode-worker@jianglens.local}"
git config --global init.defaultBranch main

gh auth status --hostname github.com >/dev/null
gh auth setup-git --hostname github.com >/dev/null

echo "GitHub CLI and git credential helper configured for github.com"
