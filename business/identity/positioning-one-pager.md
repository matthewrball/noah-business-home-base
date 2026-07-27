---
status: draft-0
owner: Ball (W2 Identity & Ops)
confidentiality: public
review_date: 2026-08-09
blocking_questions: [Q-04, Q-07]
---

# Positioning one-pager

**Draft 0 — no positioning choice is adopted.**

## What Noah is (Fact)

Noah is a mobile Bitcoin wallet built on Ark, a payment system that works on top of Bitcoin [src: https://beta.noahwallet.io/]. It is an early test version available through TestFlight, Google Play, and a direct Android download [src: https://beta.noahwallet.io/]. Its code is public [src: https://beta.noahwallet.io/] [src: noah/LICENSE].

The product combines one balance for Bitcoin, Lightning, and Ark payments with a Lightning Address — a reusable address that asks the phone to create each payment request — as the primary way to receive [src: https://blog.second.tech/introducing-noah-and-arke/] [src: gist hsjoberg/8196abaa].

## Who it is for (Proposal)

**Option A — newcomers.** People who want an approachable Bitcoin wallet and optional paths to understand more [src: gist hsjoberg/8196abaa].

**Option B — wallet upgraders.** People who already use Bitcoin or Lightning but want a simpler experience without extra Lightning setup or separate balances [src: gist hsjoberg/8196abaa] [src: https://blog.second.tech/introducing-noah-and-arke/].

TODO(Q-04 Sam: first target segment — bitcoiners upgrading from Lightning wallets, or newcomers?)

## Why it is different (Analysis)

1. **Start with the benefit, not the machinery.** Noah explains Ark in one line, then leads with what users can do [src: https://beta.noahwallet.io/].
2. **A simple surface with depth available.** The design rule is to keep things simple while rewarding curiosity [src: gist hsjoberg/8196abaa].
3. **Lightning Address as the receive experience.** Requests reach the phone, which creates the payment request on the device [src: https://blog.second.tech/introducing-noah-and-arke/].
4. **Lessons from Blixt, built in public.** Noah turns lessons from the team's earlier feature-heavy wallet into a calmer product, and Noah's code is public [src: gist hsjoberg/8196abaa] [src: noah/LICENSE].

## Positioning statement options (Proposal)

**A — newcomer-led:** Noah is the welcoming mobile gateway to Bitcoin's Ark payment system: simple to start, connected to Lightning, and ready to explain more when curiosity strikes [src: https://beta.noahwallet.io/] [src: gist hsjoberg/8196abaa].

**B — upgrader-led:** Noah brings Bitcoin, Lightning, and Ark into one calm mobile balance, without making Lightning setup the user's first job [src: https://blog.second.tech/introducing-noah-and-arke/] [src: gist hsjoberg/8196abaa].

How Noah should describe user control is unresolved. TODO(Q-07 Sam/Hampus: choose the approved plain-language description of how Noah protects user control.) [src: noah/README.md] [src: https://beta.noahwallet.io/] [src: https://blog.second.tech/introducing-noah-and-arke/].
