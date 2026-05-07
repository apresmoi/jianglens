# Elite Overproduction Status Bottleneck Atlas Promotion

Date: 2026-05-07
Work type: atlas relation promotion
Promoted surface: `website/src/content/docs/lens.md`

## Promoted Material

The reviewed proposal `content/workflow/proposals/elite-overproduction-status-bottleneck/proposal.md` is promoted into the public atlas as **Elite Overproduction As Status Bottleneck**, a compact atlas relation with durable lens point `lens-point:elite-overproduction-status-bottleneck-atlas`.

This is not a full public concept page. The cross-page review held full-page promotion because neighboring public pages already own most outputs. The atlas relation is now justified because the public atlas and concept pages repeatedly need a boundary for the status-bottleneck mechanism itself.

## Boundary

The promoted relation owns the moment when inherited or aspirational elites outnumber available status positions, offices, land, honor, command, or prestige, and the surplus turns into rent extraction, factional war, revolutionary reset, colonization, mercenary invitation, or strategic brittleness.

Neighboring surfaces keep their own boundaries:

- collapse-transition owns trigger timing, asset movement, and post-break formation;
- gerontocracy owns old-age status lock and future extraction;
- bureaucracy owns office, credential, and procedure rent once the machinery hardens;
- borderland owns outsider energy and transformation after access;
- game theory owns payoff and rule analysis;
- strategy owns enemy feedback and leadership-thinning effects.

## Source Grounding

- `video:predictive-history-qwfb-vxxkwu@transcript:v1#seg-0014` introduces Turchin's elite-overproduction reversal and permanent hereditary elites.
- `video:predictive-history-qwfb-vxxkwu@transcript:v1#seg-0017`, `seg-0019`, and `seg-0034` support rent seeking, credential/social-mobility rent, and instability from too many elites charging rent.
- `video:predictive-history-f8qqgsefggc@transcript:v1#seg-0013` and `seg-0014` support the Roman upper/lower nobility and factional-war application.
- `video:predictive-history-k-l9jbgo74@transcript:v1#seg-0018` supports elite children seeking power when there are not enough positions and status competition becoming war or revolution.
- `video:predictive-history-k-l9jbgo74@transcript:v1#seg-0033`, `seg-0034`, and `seg-0035` support faction formation, middle-class/people recruitment, mercenary invitation, and civil war/revolution/war outputs.
- `video:predictive-history-jpti2gfywru@transcript:v1#seg-0010` supports the empire/faction/revolution routing.
- `video:predictive-history-ybufqry77pq@transcript:v1#seg-0019` supports the colonization/exile route.
- `video:predictive-history-t5oisjiorsu@transcript:v1#seg-0007` supports the strategic brittleness formulation where elite overproduction turns hierarchy into factional war.

## Validation Plan

Run:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
node ops/scripts/validate-corpus-impact.mjs --all
git diff --check
npx -y -p node@22.12.0 -c 'cd website && node -v && npm run build'
node ops/scripts/validate-content.mjs
```
