# W3Booster — Product Vision

> Living document. Source of truth for *what we are building and why*.
> When code and this doc disagree, this doc wins for intent; code wins for
> mechanics. Update both in the same change.

## 1. Mission

W3Booster is the operating layer between **a live Warcraft III game** and the
people who care about it: the player improving, the streamer entertaining, and
the developer building on top.

Our unfair advantage is **structured, sub-second, in-game data extraction**.
Third-party tools work off post-game replays; we work off the running game.
Every product decision should respect that edge.

## 2. Audiences (personas)

We serve three personas. A single user can be more than one.

### 2.1 Player — improve gameplay
The competitive WC3 player who wants to get better. They drill build orders,
review their replays, watch their stats trend. They may not stream at all.

### 2.2 Streamer — entertain viewers
The broadcaster (caster, content creator, or competitive player who streams).
They want overlays that make their stream legible and engaging, automation
that reacts to game events, and tools that give viewers *agency*.

### 2.3 Developer — build on our data
External developers who want to read the live game state to build their own
overlays, bots, dashboards, or research tools. Mostly also streamers/players.

A user picks their primary persona once at first run; **Both** is allowed for
the player-streamer crossover. The Developer persona is a **facet**, not a mode
— a streamer or player can opt-in to seeing developer surfaces.

## 3. Business model

**Pro subscriptions are the only revenue lever.** No ads, no marketplace fees
in v1. The lever we pull is *depth of live data access*. Free users get the
snapshot; Pro users get the stream.

This single principle determines every feature gate. We do not gate on
*feature names* ("you cannot have build orders") — we gate on *data
richness* ("you see your supply curve; Pro sees the cohort percentile").

### Free vs. Pro philosophy

- **Free is real.** A free user must be able to use the product day-to-day or
  they churn before they convert. Free is the hook.
- **Pro is more of the same product.** Pro should never feel like a separate
  app — it feels like the same workflow with deeper data and fewer ceilings.
- **No popup paywalls.** Pro features render with a tasteful lock and an
  inline preview. Conversion happens by curiosity, not interruption.
- **Trials are time-bombed, not credit-card-gated.** First time you touch a
  Pro feature, you get 7 days free. Behavior change before paywall.

### Customer-acquisition channels

1. **Self-serve** (player or streamer hits an overlay or stats wall, upgrades).
2. **Gift Pro** (viewers gift Pro to streamers — see F1). Doubles as virality.
3. **Developer ecosystem** (third-party products that read our live data
   surface our brand to their users).

## 4. Design principles

1. **Live data first.** If a feature can be done off post-game data alone, a
   competitor can copy it. If it depends on the running game, we win.
2. **Free hooks the loop, Pro magnifies it.** Diagnose for free; coach for Pro.
3. **One picker, then it's their app.** Persona is set once. The UI does not
   constantly ask the user what they want to do.
4. **Locked previews, never blank gates.** Every Pro feature shows what it is.
5. **Persona-aware navigation.** A streamer never sees the player nav (and
   vice versa) unless they are Both.
6. **Data depth ladder, not feature exclusion.** Every page exists for free
   users in shallow form.
7. **Speed and density.** This is a power-user tool. Information per pixel is
   high. Don't water it down for novices — give them the persona picker and a
   first-run checklist instead.

## 5. The feature catalog

Each entry is *the source of truth for what the feature is*. Implementation
details live in code; the *why* lives here.

### F0 — Existing core (already shipped)

- **In-game overlay** (matchup bar, gold/supply, hero icons, researches,
  abilities, hero XP). Native Warcraft III integration via `packages/w3blib`.
- **Build order workshop.** Library, editor, and live runtime tracker for
  drilling builds in-game.
- **Recorder.** Local capture/state surfacing for desktop client.
- **Twitch login + Discord linking.**
- **PayPal-based Pro subscription.**

### F1 — Gift Pro to another user

**Problem.** Viewers want to support their favorite streamer. Today they have
to ask the streamer to upgrade themselves. We lose two conversions.

**Solution.** Anyone — including non-W3Booster-users — can gift Pro to a
recipient identified by Twitch handle. Public route, no account required to
gift. Recipient is notified in-app, sees their plan badge change, and gets a
"Gifts received" log on their Account page.

**Mechanics.**
- Public routes: `/gift` and `/gift/:twitchHandle`.
- Sender: lookup recipient by Twitch handle → pick duration (30/60/90 days) →
  optional message → PayPal checkout (existing rails) → confirmation page.
- Recipient: in-app banner on next login + bell badge in shell + entry in
  Account → "Gifts received" with sender (or "Anonymous"), date, days, message.
- Backend: new `GiftOrder` model in `packages/datamodel`; recipient lookup
  endpoint by Twitch handle (rate-limited).

**Pro/Free.** The gift mechanic itself is free for the sender. The recipient
gets Pro for the gifted duration.

**Why it matters.** Doubles as customer acquisition. A streamer with even one
Pro gifter has a viewer who already cares enough to pay — repeat conversion is
high. Also a soft proof point for self-pay viewers ("if X has Pro, I want it
too"). Should be promoted on every Pro lock surface ("Or have a viewer gift
it to you").

### F2 — Custom overlays (overlay editor + presets)

**Problem.** Today's overlays are fixed: a checkbox toggles each built-in
widget. Streamers want custom layouts, themes, widget combinations. Power
users want one preset for casts and another for solo play.

**Solution.** A visual editor where users drag widgets onto a canvas, theme
them, and save the result as a preset with its own browser-source URL.

**Mechanics.**
- New model `OverlayPreset` in `packages/datamodel` (layout JSON, owner,
  shared/public flag, theme tokens).
- Library page: list of presets with thumbnail previews and unique URLs.
  Built-in "Quick" preset matches today's toggle behavior, always free.
- Editor: snap-grid canvas, widget palette (matchup bar, heroes, gold/supply,
  researches, abilities, build-order tracker, timer, custom text), per-widget
  config, live preview against mock match data, optional attach to a running
  game for real preview.
- The `apps/overlay` runtime renders layouts from a preset URL parameter.
- Future: community gallery (`/overlays/community/:id`) with import-to-account.

**Pro/Free.**
- Free: 1 user-created preset, basic widget set, W3Booster watermark.
- Pro: unlimited presets, premium widgets (abilities, researches, hero XP),
  watermark removed, public sharing.

### F3 — Replay analysis + peer benchmarking

**Problem.** Players have no way to see *why* they lost a game in
a structured, comparable way. Generic replay sites show what happened; we can
show *what was below average*.

**Solution.** Drop-in replay analysis with cohort percentile benchmarks, then
loop the diagnosis back into the Build Orders / Practice Hub for
deliberate improvement.

**Mechanics.**
- Replay ingestion: client-side `.w3g` Wasm parser first; server-side
  aggregation later.
- Per-replay view: opening BO vs. canonical, APM/EAPM curve, supply/gold
  curves, hero level/XP, idle time, micro events.
- Benchmarking: percentile vs. cohort filtered by race / matchup / MMR band.
- Goal-tracking: pick a metric → drill in Practice Hub → next replay
  re-measures.
- Privacy: opt-in cohort contribution. Default opt-in for Pro (incentive
  alignment), opt-out for Free.
- Streamer crossover: "Match Insights" overlay widget showing post-game stat
  vs. streamer's average — viewer engagement.
- Storage: replays go to S3-equivalent; new `MatchAnalysis` model in datamodel
  for the parsed/aggregated metrics.

**Pro/Free.**
- Free: last 5 replays, basic stats (APM, supply, win/loss).
- Pro: unlimited history, percentile benchmarks, decision-lag, scout
  coverage, weekly digest.

### F4 — Public Data API (the Developer persona)

**Problem.** Third-party products want to build on our live data. Today we
have no way to let them.

**Solution.** A public API with REST endpoints for history/aggregates and a
WebSocket subscription for live game state.

**Mechanics.**
- Public dev portal: `/developers` (overview, quickstart, OpenAPI spec).
- In-app API console under Account → Developers: create/revoke API keys, view
  usage, rate limits, webhooks, audit log.
- Per-key scopes: `read-live`, `read-history`, `write-presets`, etc.
- Auth model: API keys are independent of the user's Twitch session.
- Live stream: WebSocket subscription to a streamer's current match. Streamer
  opts in publicly per-channel ("anyone with this token can read my live game
  state"), with a configurable broadcast delay (default ~30s) to mitigate
  strategy leak.
- Rate limits: free tier low; Pro tier high; live stream Pro-only.

**Pro/Free.**
- Free: history endpoints, low rate limit, no live stream.
- Pro: live event stream, high rate limit, write scopes.

### F5 — Local Event Emitter (streamer integrations)

**Problem.** Streamers want their stream tooling (OBS, Streamlabs, sounds) to
react to in-game events. Today they wire this up by hand or do without.

**Solution.** A local event bus on the desktop client emitting typed game
events, consumable in two ways: a no-code visual rule builder (most users) and
a local WebSocket / SDK (devs and the public API).

**Mechanics.**
- Promotes today's hidden "Stream-Automation" tab to a first-class page.
- Event registry (single source of truth): `game.started`, `game.ended`,
  `hero.killed`, `hero.leveled`, `expansion.built`, `army.engaged`,
  `supply.blocked`, `building.destroyed`, `researched.completed`, plus
  filterable predicates (mine/opponent, hero name, race).
- Visual rule builder: "when [event] AND [condition] → [action]". Action types:
  OBS scene/source, Streamlabs/StreamElements alert, sound, HTTP webhook,
  shell command, Discord webhook.
- Local WebSocket: same events, typed, consumed by user scripts.
- Local-first: emitter runs in the desktop client, sub-100ms reaction. The
  cloud API mirrors the same events with delay (F4).

**Pro/Free.**
- Free: 3 rules, game start/end events only.
- Pro: unlimited rules, full event catalog, conditions + webhooks.

### F6 — Player improvement features (Practice Hub depth)

These are the diagnose-drill-loop features for the Player persona that go
beyond F3.

**Diagnose:**
- Supply-block / worker-pause / idle-hero detector (live + post-game).
- Build deviation timeline vs. selected practice BO.
- Decision lag at critical points.
- Scout coverage map.
- Hotkey / control-group hygiene check.

**Drill:**
- **Live coach overlay** (Pro). While in custom games / vs AI, real-time
  whisper-overlay nudges ("Tier 2 30s late", "supply blocked", "expand window
  passed").
- Race/matchup playbooks: curated BO bundles routed by your weakest area.
- You-vs-past-you ladder.

**Loop:**
- Weekly progress digest (in-app + email).
- Goals (pick a metric, set a target, app tracks across all subsequent games).

### F7 — Streamer engagement features (Stream Hub depth)

Beyond the existing overlays, narrative and agency for viewers.

**Narrative:**
- Win-probability overlay (live %, computed from cohort outcomes).
- "Story so far" card: streak, matchup record, best timing.
- Auto-clip pivotal moments (engagement size, expansion denial, hero death
  near base) → push Twitch clip URL to chat.
- Caster narrative cues for tournament casts.

**Agency:**
- Twitch native predictions auto-driver (open at game start, settle from
  events).
- Chat polls bound to game state ("which hero pops 6 first?").
- Bits/sub-triggered events tied to next in-game milestone.

**Production polish:**
- Hero ability/cooldown bar for viewers.
- Army value gauge / income gauge.
- VOD auto-chapters by match.
- Raid landing card.

### F8 — Cross-persona

- **Replay watch party.** Sync a replay across viewers. Player loop + streamer
  engagement from one feature.
- **Discord rich presence.** Current build / score / opponent in Discord.
- **Public profile pages** (`/p/:twitchHandle`). Streamer side: what they're
  playing now. Player side: stats / goals / shareable progress. Also the
  destination for the F1 gift link.

## 6. Free / Pro matrix

| Capability | Free | Pro |
|---|---|---|
| Built-in overlays | Match bar, gold/supply, basic heroes, **W3B watermark** | + abilities, researches, hero XP, ad-free |
| Custom overlay editor (F2) | 1 preset, basic widgets | Unlimited presets, premium widgets, public sharing |
| Build orders | 5 personal builds, runtime tracker | Unlimited builds, drill analytics, **Live coach** (F6) |
| Replay analysis (F3) | Last 5 replays, basic stats | Unlimited history, cohort percentiles, decision lag, scout, weekly digest |
| Win-probability / story card (F7) | Static "match info" card | Live %, auto-clip, story-so-far |
| Automation / Event Emitter (F5) | 3 rules, game start/end only | Unlimited rules, full catalog, conditions + webhooks |
| Public Data API (F4) | History endpoints, low rate limit | **Live event stream**, high rate limit, write scopes |
| Gift Pro (F1) | Sending works for anyone | Receiving extends Pro |
| Discord Pro role | — | Yes + privileged support |

## 7. What we are explicitly *not* doing in v1

- **Selling a marketplace** (community presets / build orders for money). Park
  for v2; F2 design already supports it.
- **A separate developer plan.** API access is bundled into Pro to seed the
  ecosystem. Revisit if developer abuse / cost becomes a real signal.
- **Mobile app.** The web client serves account/overlay management on mobile;
  in-game features are desktop-only.
- **Coach human-marketplace** (book a coach). Out of scope.

## 8. Glossary

- **Persona** — Player / Streamer / Both / (Developer facet). Set once at first
  run, edited in Account.
- **Quick preset** — The built-in default overlay preset that maps to today's
  toggle behavior. Always free.
- **Cohort** — The anonymized population of W3Booster matches we benchmark
  individual replays against, filtered by race / matchup / MMR band.
- **Live coach** — Pro-only real-time nudges during a game.
- **Watermark** — Small W3Booster mark on free overlays. Removed for Pro.
