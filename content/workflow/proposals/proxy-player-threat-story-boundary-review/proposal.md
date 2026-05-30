# Proxy Player And Threat-Story Boundary Review

Date: 2026-05-30
Status: concept-scoped boundary proposal; public prose held
Work type: synthesis after the Game Theory proximity split
Public surface affected later: `website/src/content/docs/lens/game-theory.md`, `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`, `website/src/content/docs/lens/chokepoint-empire-and-no-exit-war.md`, and `website/src/content/docs/lens/imperial-retrenchment-and-proxy-attrition.md`

## Decision

Do not immediately split **Proxy Player And Threat-Story Audit** into a public child page. Keep the two existing Game Theory anchors on the parent for now:

- `lens-point:game-theory-proxy-war-real-player`
- `lens-point:game-theory-threat-story-real-game`

The mechanism is real and source-backed, but the current public boundary is still doing useful parent-page work. It teaches a method: before judging whether a move is rational, ask whether the visible actor is the real player and whether the public threat story names the actor's actual payoff. The source fan-in is not yet as mature as the just-split Proximity Games cluster, and several nearby Strategy-family sources need routing before a child page would be stable.

The next public mutation should be a small **parent compression and routing pass**, not a new child page. Compress the Game Theory proxy/threat sections only if the edit clarifies the boundary with Strategy, Chokepoint Empire, Imperial Retrenchment, Nation, and Prediction. Do not move the anchors until another two or three high-quality sources recur with the same player-identification and threat-story mechanism.

## Why This Advances The Lens

PR #727 split the mature domestic-proximity cluster out of Game Theory. That creates a tempting next move: split the next named candidate too. This proposal slows that reflex and asks whether the second candidate has enough independent public weight.

The answer is mixed. The proxy-player and threat-story mechanisms are valuable, but they are currently serving as diagnostic gates into adjacent lenses. A premature child page would likely become a geopolitical catchall for Ukraine, NATO, Taiwan, Iran, Odessa, Japan, and proxy war. The better stewardship move is to preserve Game Theory as the method page while marking exactly what evidence would justify a later child.

This is synthesis work, not historical backfill. The live impact audit still shows many missing records, including public-anchor Strategy sources, but the recent Game Theory split left an explicit boundary question. Resolving that question prevents the next Plato run from appending another correct but structurally expensive proxy-war example to the parent.

## Current Source Base

The parent already has two strong source bases:

- **Undated Russia Today interview**, `interview-qsxkdk4mzgk`: Jiang defines psychohistory as psychoanalysis plus game theory, treats nation-states as actors with memory and motive, and then reframes Ukraine as a war whose player set includes Ukraine, Russia, Europe, U.S. support, war economy, future conscription, and elite incentives (`video:interview-qsxkdk4mzgk@transcript:v1#seg-0004`, `video:interview-qsxkdk4mzgk@transcript:v1#seg-0034`, `video:interview-qsxkdk4mzgk@transcript:v1#seg-0036`).
- **2025-10-30**, `interview-xrk5vsezj4y`: Jiang says Ukraine supplies the troops while NATO supplies financing, technology, special forces, command and control, and targeting; the same interview rejects the Taiwan invasion story because invasion would worsen China's broader board (`video:interview-xrk5vsezj4y@transcript:v1#seg-0018`, `video:interview-xrk5vsezj4y@transcript:v1#seg-0019`, `video:interview-xrk5vsezj4y@transcript:v1#seg-0050`, `video:interview-xrk5vsezj4y@transcript:v1#seg-0054`).

Several later impact files point toward the same boundary but should not be dumped into Game Theory:

- **2025-10-07**, `interview-qdzkv36zyfk`: Iran, Russia, China, and the United States are mapped as actors with different payoffs, but the strongest reusable mechanisms are Hormuz/world-war material audit, eschatological role assignment, and strategic sequencing (`video:interview-qdzkv36zyfk@transcript:v1#seg-0011`, `video:interview-qdzkv36zyfk@transcript:v1#seg-0021`, `video:interview-qdzkv36zyfk@transcript:v1#seg-0022`, `video:interview-qdzkv36zyfk@transcript:v1#seg-0087`).
- **2026-01-24**, `interview-2f3osvzg2ti`: the Taiwan section repeats threat-story correction by naming economic absorption as China's preferred payoff, while the source's larger pressure belongs to Chokepoint Empire, Imperial Retrenchment, Power As Alchemy, Mass Society, and forecast-ledger comparison (`video:interview-2f3osvzg2ti@transcript:v1#seg-0064`, `video:interview-2f3osvzg2ti@transcript:v1#seg-0065`, `video:interview-2f3osvzg2ti@transcript:v1#seg-0066`, `video:interview-2f3osvzg2ti@transcript:v1#seg-0067`).
- **2026-04-24**, `interview-37qm5feukw8`: "no nation is a monolith" supports faction-aware player naming, but the source's public pressure is still Chokepoint Empire and Imperial Retrenchment, not a new Game Theory child (`video:interview-37qm5feukw8@transcript:v1#seg-0097`, `video:interview-37qm5feukw8@transcript:v1#seg-0098`, `video:interview-37qm5feukw8@transcript:v1#seg-0099`).

## Boundary

**Game Theory** owns the diagnostic when the active question is player naming or payoff correction:

- Is the visible battlefield actor also the actor whose incentives prolong the game?
- Have financing, weapons, command, intelligence, manpower, elite profit, or audience moved agency to another player?
- Does the public threat story name a move that would actually worsen the actor's larger board?
- Is the actor optimizing for a quieter payoff, such as economic absorption, alliance dependency, domestic faction advantage, or status quo stability?

**Strategy Material Test** owns the material audit after the player map is named: troops, logistics, conscription, battlefield endurance, infrastructure, exits, escalation control, morale, and whether the war can still be fought.

**Chokepoint Empire And No-Exit War** owns gates and access-control war: Hormuz, Malacca, blockades, naval policing, food and energy circulation, protection credibility, and war momentum after a strait or route becomes the system pivot.

**Imperial Retrenchment And Proxy Attrition** owns who pays when the empire cannot carry the old cost directly: allied bodies, NATO weapons purchases, European draft pressure, successor-muscle auditions, fortress-resource retreat, and proxy expenditure.

**Nation As God-Machine** owns Taiwan or Ukraine when the active mechanism is sacred national body, population sacrifice, unity, or sovereignty identity rather than payoff correction.

**Prediction As Falsifiable Prophecy** owns date-locked claims and audit discipline when Jiang risks a future claim: Taiwan non-invasion, Odessa horizons, Iran escalation windows, Trump-Xi rapprochement, and later forecast comparison.

## What Not To Do Next

Do not create a public page named "Proxy Player And Threat-Story Audit" yet. The page would probably open with Ukraine, immediately need Taiwan, then pull Iran, Odessa, NATO, Europe, Japan, and China into one surface. That would recreate the bloat just removed from Game Theory.

Do not move `game-theory-proxy-war-real-player` or `game-theory-threat-story-real-game` to Chokepoint Empire. Chokepoint can cite the game-theory method when it needs player naming, but its own anchors should stay material: gates, routes, energy, protection credibility, ground-war costs, and exit traps.

Do not fold the Taiwan threat-story material into Nation by default. Nation matters when the issue is Taiwan as sacred national body. The Game Theory anchor matters when the issue is Jiang's claim that invasion is a bad payoff for China because the surrounding board is already better than the threat story admits.

Do not turn all proxy-war material into Game Theory. When Jiang is asking whether Europe can draft, whether Ukraine can hold Odessa, whether allied warehouses can supply the war, or whether NATO can admit defeat, the active lens is Strategy or Imperial Retrenchment.

## Conditions For A Later Public Child

Reconsider the child page only if at least two of the following happen:

1. Additional corpus-impact files identify exact public-read marks that should link to `game-theory-proxy-war-real-player` or `game-theory-threat-story-real-game`.
2. The Game Theory parent rises back above roughly 6,000 words because proxy/threat material expands again.
3. A cross-source comparison shows at least four dated Jiang sources where the same mechanism recurs without being better owned by Strategy, Chokepoint, Imperial Retrenchment, Nation, or Prediction.
4. The later public edit can preserve the child as a method page for player identification, not a topical page for Ukraine, Taiwan, or Iran.

## Proposed Next Public Mutation

Make a small Game Theory parent compression PR only if the page is already being revised. The edit should:

1. Keep both proxy/threat anchors on the parent.
2. Shorten the section prose around Ukraine and Taiwan if possible.
3. Add one clean routing sentence that sends material execution to Strategy, gates/no-exit to Chokepoint, cost transfer to Imperial Retrenchment, national-body claims to Nation, and dated claims to Prediction.
4. Avoid adding new public evidence from `interview-qdzkv36zyfk`, `interview-2f3osvzg2ti`, or `interview-37qm5feukw8` until those sources are being handled in a concept-scoped public mutation or impact/link pass.

## Next Useful Work

The next useful lens mutation is not another Game Theory child. Choose one of:

1. Backfill corpus impact for a public Chokepoint anchor source already named by the Iran-war routing proposal: `interview-pvhuffwtu3i`, `interview-px5wsnsqwme`, or `predictive-history-ts-aa6lqf6i`.
2. Run a public Chokepoint chronology compression pass after those public-anchor impact gaps are closed.
3. If returning to Game Theory, do only parent compression/routing unless new source accounting proves the proxy/threat cluster has become child-ready.
