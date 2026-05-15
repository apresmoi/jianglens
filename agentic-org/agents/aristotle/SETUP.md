# Aristotle Setup

Aristotle runs inside the shared Spawnfile-managed Jiang Lens org.

The workspace repo checkout is:

```text
repos/jiang-lens
```

Before work:

```bash
cd repos/jiang-lens
git fetch origin
gh auth setup-git --hostname github.com
```

Review source PRs only:

```bash
gh pr list --repo apresmoi/jianglens --state open \
  --json number,title,headRefName,url,mergeStateStatus,updatedAt
```

Source PR branch prefixes:

```text
episode/*
interview/*
```

Use `jiang-episode-quality-review` for the actual review. If a source PR passes,
comment with `QA PASS` and enable auto-merge. If it fails, comment with
`QA NEEDS WORK` and mention `@virgil` in `episode-floor`.

Do not inspect other agents' private runtime filesystems. Use the PR branch,
repo files, validators, transcript/source artifacts, GitHub, and Moltnet.
