# Workflow

Workflow files coordinate agent work without letting drafts become canon accidentally.

- `proposals/` contains draft changes or extraction results.
- `reviews/` contains grounding and consistency checks.
- `promotions/` records accepted changes.
- `tasks/` stores agent work packets and lightweight work items.

Promotion requires stable source refs, dated source snapshots, and agent semantic outputs with confidence. Human review is report-driven; corrections should be made when reports or later passes reveal mistakes.

Chronology is part of review. A proposal should keep older and newer dated positions separate, identify the latest dated position, and explain whether a change is a contradiction, refinement, or context shift.
