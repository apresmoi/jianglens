# Legitimacy Fiction Post-Scripture Review

Date: 2026-06-06
Status: workflow-only concept-scoped governance record
Work type: synthesis after public child extraction and Cassandra source-density cue
Public surface affected later: `website/src/content/docs/lens/legitimacy-fiction.md`

## Decision

Keep [Legitimacy Fiction](/lens/legitimacy-fiction/) whole after the public extraction of [Scripture, Identity, And Imperial Authorization](/lens/scripture-identity-and-imperial-authorization/).

The parent is under watch pressure, not immediate split pressure. On current `main`, it measures about 5,319 words, 15 distinct local evidence source slugs, and 11 durable parent anchors. The Scripture child already carries the two scripture/identity anchors that were named in the first-split recommendation:

- `legitimacy-fiction-scripture-outlives-spin`
- `legitimacy-fiction-imperial-script-edits-identity`

Do not create another Legitimacy Fiction child now. Do not append ordinary Caesar, monarchy, false-messiah, national-credit, reconciliation-theater, mercy, or America-as-game examples to the parent unless the edit replaces weaker prose or a new source forces a boundary revision.

## Why This Advances The Lens Map

This answers the remaining public-page pressure cue without turning the broad historical impact backlog into the work queue. `audit-corpus-impact` still reports 158 historical gaps, but no fresh high-pressure source overrides the current synthesis cadence. Recent Plato work already compressed or reviewed Attention, Education, and Human Heart after Cassandra's page-pressure list. Legitimacy Fiction is the next named page whose prior decision needs reconciliation with the live public state.

The earlier source-density warning was accurate enough to force action: Legitimacy Fiction was above the ordinary split-review line before the Scripture child extraction. That action has now happened. The public parent is no longer above the warning line, and the cleanest child candidate has already become public with stable anchor IDs preserved.

The useful governance step is therefore not another split. It is to record the new threshold: Legitimacy Fiction remains the inheritance-through-political-fiction parent, while Scripture owns the textual and imperial-authorization route.

## Current Parent Boundary

Keep Legitimacy Fiction as the parent when the active mechanism is political inheritance:

- a crisis needs more than force, secrecy, or temporary spin;
- a story, name, office, title, ritual, debt, rule, mercy practice, public scene, or text becomes the carrier;
- multiple actors need the fiction enough to repeat it, compete inside it, or teach it;
- the fiction survives founder death, scandal, battle, election, fiscal emergency, or institutional collapse;
- later people inherit the made world as scripture, title, constitution, office, debt, rule, role, wound, or game board.

The parent should remain a gateway with compressed examples: Caesar/Octavian, useful Holy Roman fiction, Napoleon's moving myth, oligarchy crying for monarchy, false messiah demand, money-glue collapse, reconciliation theater, mercy as status grammar, national credit, and America as rule-game.

## Child And Neighbor Boundaries

[Scripture, Identity, And Imperial Authorization](/lens/scripture-identity-and-imperial-authorization/) owns crisis writing plus imperial authorization: David's apology, Literary Genesis family-story identity, Cyrus's return/temple memory, Ezra/Artaxerxes authorization, law, purity, public reading, and written memory becoming inheritable political identity.

Hold these possible children unless later pressure changes the map:

- **Caesar, False Messiah, And Oligarchic Monarchy:** plausible but still better carried by the parent because it teaches the legitimacy transition from oligarchic despair to personal rule. Reopen only if clustered episode links need a narrower hover or new dated sources repeat the full Caesar/monarchy/dictatorship sequence beyond the current gateway.
- **Credit, Rules, And The Playable Political Body:** plausible but not ready. National credit and America-as-game still teach how debt, law, rights, money, and citizenship become inheritable political form. Route money-as-trained-reality to Power, sacred national body to Nation, and player/payoff method to Game Theory.
- **Reconciliation Theater / Mercy Status Grammar:** keep on the parent. These are compact mechanisms showing how an audience translates an act into legitimacy. Use Human Heart for actual forgiveness or relational repair and Game Theory for coalition incentives.

Neighboring pages remain clearer by active mechanism:

- [How Stories Control Reality](/lens/how-stories-control-reality/) owns narrative world-setting, screen feedback, story virus, and moral inversion when political inheritance is secondary.
- [How Poetry Creates Civilization](/lens/how-poetry-creates-civilization/) owns scripture, epic, rhythm, and language as memory media when political authorization is secondary.
- [Power As Alchemy](/lens/power-as-alchemy/) owns money, debt, and abstraction becoming lived reality at the level of perception.
- [Nation As God-Machine](/lens/nation-as-god-machine/) owns national personhood, school, welfare, industry, sacrifice, and sacred collective body.
- [Eschatology As Script](/lens/eschatology/) owns temple, return, holy empire, Antichrist, Third Temple, and sacred sequence when end-times role assignment is primary.
- [Game Theory](/lens/game-theory/) owns real-player, payoff, faction, and nearest-board diagnosis when inheritance of political form is not the active question.

## Conditions That Reopen Public Mutation

Reopen Legitimacy Fiction for a Dante-reviewed public mutation if one of these becomes true:

- the parent rises above about 6,000 words or 20 distinct local evidence source slugs again;
- a second child candidate reaches at least four strong dated sources not better owned by neighboring pages;
- episode-to-lens links cluster around one parent anchor enough that the hover target needs a dedicated reader page;
- future corpus-impact records repeat a full Caesar/false-messiah/oligarchic-monarchy sequence, or a full credit/rules/playable-body sequence, rather than using those as gateway examples;
- a new older source changes the chronology of the parent mechanism or shows that a current child boundary is misleading.

Until then, the next public Legitimacy Fiction move should be replacement/compression only, preserving the 11 parent anchors and keeping Scripture as the child gateway. The next ordinary Plato synthesis target should probably be Game Theory only if live metrics or link clustering contradict the June 2 compression decision; otherwise move to a different pressure page or a concept-scoped Prediction/Power proposal.

## Validation Plan

This record changes workflow governance only. It should run:

- `node ops/scripts/compile-content.mjs`
- `node ops/scripts/validate-content.mjs`
- `node ops/scripts/validate-corpus-impact.mjs --all`
- `git diff --check`
- `cd website && npm run build`

Dante review is not required because no public lens prose, lens-point IDs, atlas navigation, or episode/interview read JSON changed.
