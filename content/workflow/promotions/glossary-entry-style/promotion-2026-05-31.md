# Glossary Entry Style Promotion

Date: 2026-05-31
Work type: glossary style and public route promotion

Promoted from:

- `content/workflow/proposals/glossary-entry-style/proposal.md`
- `content/workflow/reviews/glossary-entry-style/local-judge-2026-05-31.md`

Promoted to:

- `content/lens/glossary/knights-templar.md`
- `content/lens/glossary/eschatology.md`
- `content/lens/glossary/poetry-as-virus.md`
- `.codex/skills/jiang-glossary-entry-writer/SKILL.md`
- `ops/scripts/compile-content.mjs`

## Reason

The project needs a compact search and agent entry layer between generated topic pages and full lens chapters. The initial glossary style loop produced a repeatable format that can answer concrete search questions, preserve Jiang-specific source pressure, and route users to exact source refs without forcing every term into the lens atlas.

## Public Mutation

The compiler now treats `content/lens/glossary/*.md` as canonical source and generates:

- `/glossary/`
- `/glossary/knights-templar/`
- `/glossary/eschatology/`
- `/glossary/poetry-as-virus/`

These pages are searchable public docs, but they are not added to the main lens atlas.

## Validation

Run:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
node ops/scripts/validate-corpus-impact.mjs --all
cd website && ASTRO_SITE=https://jianglens.com npm run build
cd website && npm run check:production-output
```

