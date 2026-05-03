# Lens Compression v0

## One-line definition
Lens Compression turns a long-form analytical corpus into a source-grounded canon, then compiles that canon into portable reasoning instruments that LLMs can apply to new material.

## First case study
**Predictive History / Jiang Xueqin**.

The corpus is attractive because it is already system-like: lectures are organized into series, the site exposes a glossary and reading list, and the content repeatedly applies historical structures and game-theoretic reasoning to live events.

## What the lens should contain

### Source registry
- YouTube channel metadata and video list
- Transcript or article text per lecture
- Ghost article URLs
- Glossary terms
- Reading-list references
- Prediction tracker entries, if usable

### Canon
Source-grounded reconstruction of the system:
- world model
- actors
- forces
- models
- mechanics
- myths / literary structures where used analytically
- prediction protocol

Canon is Jiang-source-only in the Predictive History case. Agents can propose structure, but canonical material requires reviewed source refs.

### Glossary / concept registry
Terms and concepts that the lens can activate, each with:
- canonical label
- short definition
- source examples
- related concepts
- confidence that this is actually part of the corpus

### Causal templates
Candidate reasoning moves, pending source grounding:
- escalation dynamics
- empire overextension
- asymmetric warfare
- elite coordination
- narrative collapse
- civilizational inversion
- eschatological convergence
- strategic ambiguity

These are not canon. They are extraction hypotheses until source refs, evidence matrix, and reviews promote them.

### Ledger
Jiang's applied analysis:
- diagnoses of current/historical situations
- predictions and forecast-like claims
- active lens primitives behind the diagnosis
- source refs and uncertainty
- outcome tracking where possible

### Commentary layer
External supports, challenges, audience readings, and critiques. Commentary attaches to canon or ledger targets but does not alter canon.

### Application protocol
When analyzing new material, the lens should:
1. Summarize the source without lens language.
2. Identify active lens primitives.
3. Build the actor / incentive map.
4. Map the causal chain.
5. Identify historical analogies the lens would reach for.
6. Separate evidence from inference.
7. Generate prediction candidates only when warranted.
8. State uncertainty and failure modes.
9. Offer at least one counter-reading.

### Runtime output schema
```markdown
## Source Summary

## Active Lens Primitives

## Actor / Incentive Map

## Causal Chain

## Historical Analogies

## Prediction Candidates

## Uncertainty

## Counter-Readings

## Source Grounding

## Lens Failure Modes
```

## What v0 is not
- Not a complete archive of Predictive History.
- Not a chatbot pretending to be Jiang.
- Not a fact-checker.
- Not a prophecy generator.
- Not an idea-diffusion map.
- Not Juan's interpretation layer.
- Not a place where external commentary rewrites Jiang's canon.

## First build path
1. Create the markdown-first repo scaffold: `corpus/`, `canon/`, `glossary/`, `ledger/`, `evidence/`, `proposals/`, `reviews/`, `commentary/`, `tasks/`, `skills/`, `site/`, `scripts/`.
2. Ingest one high-signal Predictive History video end-to-end.
3. Produce raw transcript, cleaned JSONL, and readable markdown with stable source refs.
4. Extract proposals for terms, models, diagnoses, predictions, and evidence links.
5. Run grounding and consistency review.
6. Promote a small number of reviewed entries into canon/glossary/ledger.
7. Back-apply any new primitives to the first video as evidence files.
8. Render a static site view.
9. Only then draft a first `predictive-history-lens` skill from the canon.

## Evaluation questions
- Does the skill notice things a generic model misses?
- Does it preserve uncertainty?
- Does it cite the lens source material instead of hallucinating?
- Does it avoid turning every event into the same hidden-structure story?
- Is the compressed lens small enough to load but strong enough to affect reasoning?
- Do agents catch each other's weak groundings before promotion?
- Can new Jiang sources update old evidence links without breaking refs?
- Can external commentary attach usefully without contaminating canon?
- Do runtime outputs cite canon IDs for every activated primitive?
- Are runtime predictions labeled `lens-generated` rather than Jiang-authored?
