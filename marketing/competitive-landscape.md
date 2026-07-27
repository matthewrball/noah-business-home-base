---
status: draft-0
owner: W4 Market (Ball's team)
confidentiality: public
review_date: 2026-08-09
blocking_questions: [Q-03, Q-04, Q-08]
---

# Competitive Landscape

**Draft 0 — no business decisions are represented as adopted.** Web facts captured 2026-07-26/27; every fact cites its source. Noah is a mobile Bitcoin wallet built on Ark, a second-layer protocol for Bitcoin [src: https://beta.noahwallet.io/].

## Comparison table

| Wallet | Custody | Payments tech | UX approach | Monetization | Platforms | Source |
|---|---|---|---|---|---|---|
| **Muun** | Self-custodial (2-of-2 multisig: phone key + server key; recoverable without Muun via Emergency Kit) | Bitcoin on-chain; Lightning executed as on-chain swaps — no channels to manage, but every Lightning payment carries on-chain fees | Beginner-friendly; one unified balance, zero configuration | No fee schedule found on muun.com (Analysis); review-reported undisclosed swap margin and $0.10–$5+ per Lightning send | iOS, Android | [src: https://blog.muun.com/muuns-multisig-model/] [src: https://www.bitcoin.diy/reviews/muun] |
| **Phoenix** (ACINQ) | Self-custodial; 12-word phrase; provider maintains the user's single Lightning channel | Real Lightning node on the phone; channel auto-resized by ACINQ, who is paid as the service provider | Lightning without channel management | 0.4% per send (minimum 4 satoshis), shown in advance; about 1,000 satoshis once for initial receive capacity | iOS, Android | [src: https://acinq.co/blog/phoenix-splicing-update] |
| **Aqua** (JAN3) | Non-custodial; local 12-word seed; no identity checks (KYC) | Bitcoin + Liquid (a federated Bitcoin sidechain); Lightning via third-party swap providers; stablecoin support | Everyday, non-technical users; Latin America focus; "the wallet my mom would use" | No wallet fee; third-party providers charge network and swap fees, and the reviewed source does not show that Aqua receives them (Analysis) | iOS, Android (incl. F-Droid) | [src: https://aqua.net/] [src: https://jan3.zendesk.com/hc/en-us/articles/34940028331163-What-are-the-fees-on-AQUA] |
| **Blixt** | Fully non-custodial; complete Lightning node runs on the phone | Embedded LND node + light-client chain sync; power features (Tor, NFC, node tools) | Intermediate-to-advanced users who want a self-hosted node | OpenSats-funded open-source project | Android, iOS, macOS | [src: https://github.com/hsjoberg/blixt-wallet/blob/master/README.md] [src: https://opensats.org/projects/blixt] |
| **Phantom** | Self-custodial | Multichain (Solana, Ethereum, Bitcoin, Base + more); trading and payments features | Mainstream crypto audience; polished, low-friction onboarding; "everything in one interface" | Review-reported: 0.85% swap fee, ~1.5% gasless swaps; derivatives and stablecoin lines | Browser extensions, iOS, Android | [src: https://www.datawallet.com/crypto/phantom-wallet-review] |
| **Family** | Self-custodial; passkey-based, seed-phrase-free onboarding | Ethereum + major second-layer networks; built-in swaps and chat | Design benchmark: onboarding, micro-animations, consistent polish | States no wallet fees; no monetization model found published (Analysis; owned by Avara) | iOS, web dashboard | [src: https://family.co/blog/family-accounts] [src: https://family.co/faqs] |
| **Arkade** (Ark Labs) | Self-custodial | Ark-native web app; talks to Ark Labs' server software; stablecoin/token support planned | Installable web app (no app store); developer-ecosystem focus | No monetization found documented (Analysis); company backed by Tether-led $5.2M seed (Mar 2026) | Installable web app (mobile + desktop) | [src: https://github.com/arkade-os/wallet] [src: https://bitcoinmagazine.com/news/ark-labs-raises-5-2m-with-tether] |

## Competitor notes

**Muun** pioneered the "one balance, zero configuration" experience Noah's design philosophy explicitly admires [src: gist hsjoberg/8196abaa]. Its trade-off: Lightning payments are executed as on-chain swaps, so fees rise with Bitcoin network congestion — reviews report costs "10 to 50 times higher" than native Lightning wallets [src: https://www.bitcoin.diy/reviews/muun].

**Phoenix** delivers genuinely self-custodial Lightning by running a node on the phone with a single company-managed channel, monetized at 0.4% per send [src: https://acinq.co/blog/phoenix-splicing-update]. ACINQ pulled Phoenix from US app stores in May 2024 amid regulatory uncertainty [src: https://www.tftc.io/phoenix-wallet-removed-us-app-stores/]. A secondary review reports that Phoenix returned in April 2025; no primary confirmation was found in this research pass [src: https://www.bitcoinproducts.com/blog/phoenix-wallet-review].

**Aqua** pairs Bitcoin with the Liquid sidechain and stablecoins, targeting non-technical users in emerging markets; JAN3 raised a $5M seed (Jan 2025) led by Fulgur Ventures with Tether as strategic backer [src: https://www.finsmes.com/2025/01/jan3-raises-5m-in-seed-funding.html]. Noah's design notes credit Aqua with getting the user experience right [src: gist hsjoberg/8196abaa].

**Blixt** is the direct ancestor: its team built Noah, and Noah's philosophy treats Blixt's power-user maintenance burden as a lesson learned rather than a model to repeat [src: https://opensats.org/projects/blixt] [src: gist hsjoberg/8196abaa]. Blixt also demonstrates a grant-funded open-source development path [src: https://opensats.org/projects/blixt].

**Phantom and Family** are not Bitcoin-wallet competitors but set the design bar Noah aims at — Phantom's "great welcoming design" and Family's "great visual design" per Noah's design notes [src: gist hsjoberg/8196abaa]. Phantom also shows what wallet-scale monetization looks like: $150M Series C at a $3B valuation with 15M monthly users, earning swap and trading fees [src: https://phantom.com/learn/blog/phantom-series-c] [src: https://www.datawallet.com/crypto/phantom-wallet-review].

**Arkade** is the nearest Ark-native comparator, built by Ark Labs — a separate company from Second, whose software Noah builds on [src: https://github.com/arkade-os/wallet] [src: https://beta.noahwallet.io/]. Arkade is a self-custodial web app with a broader ambition (stablecoins and tokens on Ark), backed by a Tether-led seed round [src: https://github.com/arkade-os/wallet] [src: https://www.theblock.co/post/375271/ark-labs-arkade-public-beta-layer-2-bitcoin] [src: https://bitcoinmagazine.com/news/ark-labs-raises-5-2m-with-tether]. Other wallets in Second's June 2026 launch lineup — Arke (iOS), Satsigner, a self-hosted Umbrel app, and a BTCPay merchant plugin — are early-stage or serve adjacent niches [src: https://bitcoinmagazine.com/news/second-launches-bark-on-bitcoin-mainnet].

## Market context

Ark went live on Bitcoin in June 2026 through Second's implementation, with Noah in the launch lineup [src: https://bitcoinmagazine.com/news/second-launches-bark-on-bitcoin-mainnet]. Its promoted advantage over Lightning-based rivals is user control without extra Lightning setup or setting aside receiving capacity [src: https://bitcoinmagazine.com/news/second-launches-bark-on-bitcoin-mainnet]. The design expects service operators to earn fees for grouping settlements and supplying funds needed to complete payments [src: https://www.spark.money/research/ark-protocol-explained] [src: https://bitcoinops.org/en/topics/ark/].

No numeric fee schedule was found for either production operator in the reviewed operator pages, software repositories, launch coverage, and protocol references (Analysis) [src: https://second.tech/] [src: https://codeberg.org/ark-bitcoin/bark] [src: https://github.com/arkade-os/arkd] [src: https://bitcoinmagazine.com/news/second-launches-bark-on-bitcoin-mainnet] [src: https://bitcoinops.org/en/topics/ark/]. TODO(Q-08 Sam: does the team intend Noah to run its own Ark payment service eventually, or remain a client of Second?)

## What Noah uniquely offers (Analysis)

Synthesis of the table and notes above; cites its input facts.

1. **A specific combination inside this reviewed set.** Noah is the only entry in this seven-wallet comparison that combines native mobile delivery, Bitcoin-only scope, Ark, and newcomer-oriented positioning (Analysis) [src: https://beta.noahwallet.io/] [src: https://muun.com/] [src: https://acinq.co/blog/phoenix-splicing-update] [src: https://aqua.net/] [src: https://github.com/hsjoberg/blixt-wallet/blob/master/README.md] [src: https://www.datawallet.com/crypto/phantom-wallet-review] [src: https://family.co/faqs] [src: https://github.com/arkade-os/wallet].
2. **One balance through a different mechanism from Muun.** Noah presents one balance spendable through Lightning, on-chain Bitcoin, or Ark, with the Ark design grouping payments rather than creating Muun's on-chain swap for each payment (Analysis) [src: https://blog.second.tech/introducing-noah-and-arke/] [src: https://ark-protocol.org/] [src: https://blog.muun.com/a-closer-look-at-submarine-swaps-in-the-lightning-network/].
3. **On-device payment requests as the primary receive path.** Noah's materials emphasize a Lightning Address whose payment request is created on the user's device [src: https://blog.second.tech/introducing-noah-and-arke/] [src: gist hsjoberg/8196abaa]. Blixt also documents a trust-minimized Lightning Address, but its materials address users who want advanced node controls; the distinction is audience and surface simplicity, not exclusive capability (Analysis) [src: https://blixtwallet.github.io/] [src: https://github.com/hsjoberg/blixt-wallet/blob/master/README.md].
4. **Published lessons carried from Blixt into Ark.** The team's stated move away from Blixt's maintenance-heavy, advanced-user model toward “simple on the surface, reward curiosity” directly informs Noah's Ark-based mobile design (Analysis) [src: gist hsjoberg/8196abaa] [src: https://opensats.org/projects/blixt] [src: https://beta.noahwallet.io/].

Open dependencies for this analysis: TODO(Q-03 Sam: any entity/funding/revenue arrangement with Second that docs must treat as fact?) TODO(Q-04 Sam: first target segment — bitcoiners upgrading from Lightning wallets, or newcomers?)
