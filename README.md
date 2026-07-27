---
status: draft-0
owner: W5 Integrator
confidentiality: public
review_date: 2026-08-09
blocking_questions: [Q-02]
---

# Noah — business home base

Draft-0 decision material for Noah, a mobile Bitcoin wallet built on Ark, a payment system that works on top of Bitcoin [src: https://beta.noahwallet.io/]. This is an authoring workspace, not a record of adopted business decisions. After Fizz confirms the file placement, Buzz is the canonical working copy; Q-02 decides only whether it also mirrors to GitHub.

## How to read this workspace

- **Fact:** a verifiable claim ending with `[src: URL-or-repo-path]`.
- **Analysis:** a conclusion that cites the Facts it uses.
- **Proposal:** two or three evidence-backed options for reaction; never an adopted choice.
- **Unknown:** `TODO(Q-nn owner: directly answerable question)`, registered once in [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md).
- **Unresolved-state rule for people and AI:** anything marked `draft-0`, every `TODO(Q-…)`, and the entire open-question registry remain unresolved. Never repeat them as ground truth or policy.
- **Two-register rule:** use the community register for informal team spaces and the external register for public copy. [`brand-voice-guide.md`](business/voice/brand-voice-guide.md) defines both; do not move casual community language into public copy unchanged.
- **Word limits are hard maximums.** No padding, invented metrics, market sizing, fees, or decisions.

## Artifact index

| Path | Purpose | Confidentiality |
|---|---|---|
| [`business/identity/mission-vision-values.md`](business/identity/mission-vision-values.md) | Mission, vision, and value options | public |
| [`business/identity/positioning-one-pager.md`](business/identity/positioning-one-pager.md) | Plain-language positioning options | public |
| [`business/identity/user-personas.md`](business/identity/user-personas.md) | Persona options | team-confidential |
| [`business/strategy/fact-base.md`](business/strategy/fact-base.md) | Working source index; finding aid, not external evidence | internal-sensitive |
| [`business/strategy/lean-canvas.md`](business/strategy/lean-canvas.md) | Nine-box Draft-0 canvas | team-confidential |
| [`business/strategy/business-plan.md`](business/strategy/business-plan.md) | Integrated Draft-0 business plan | team-confidential |
| [`business/strategy/revenue-model-options.md`](business/strategy/revenue-model-options.md) | Revenue options; no decision made | team-confidential |
| [`business/ops/operating-cadence.md`](business/ops/operating-cadence.md) | Six-week operating-trial proposal | team-confidential |
| [`business/voice/brand-voice-guide.md`](business/voice/brand-voice-guide.md) | Community and external registers | team-confidential |
| [`business/voice/telegram-corpus.md`](business/voice/telegram-corpus.md) | Partial local voice sample; never upload | internal-sensitive |
| [`marketing/competitive-landscape.md`](marketing/competitive-landscape.md) | Cited comparison and Noah synthesis | public |
| [`marketing/gtm-plan.md`](marketing/gtm-plan.md) | Beta-to-launch options | team-confidential |
| [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md) | Canonical Q-01–Q-11 registry | team-confidential |
| [`team/telegram-digest.md`](team/telegram-digest.md) | Paste-ready reaction questions | team-confidential |
| [`team/buzz-handoff.md`](team/buzz-handoff.md) | Privacy-gated Fizz handoff package | internal-sensitive |

## Feedback and publication flow

1. Review the 3–5 questions in [`team/telegram-digest.md`](team/telegram-digest.md) with the Noah team.
2. Record answers in the open-question registry and update only the affected Draft-0 documents; an answer does not silently adopt every linked Proposal.
3. Use [`team/buzz-handoff.md`](team/buzz-handoff.md) to send files manually to Fizz. Do **not** invoke the Buzz CLI.
4. Upload public files by default. Upload team-confidential files only after Fizz confirms the destination is workspace-private. Never upload internal-sensitive files.
5. Treat the canvas cheat-sheet as channel-visible; paste no confidential content into a canvas.

TODO(Q-02 Workspace owner/product lead: should the Buzz docs repository remain the single home, or mirror to GitHub?)
