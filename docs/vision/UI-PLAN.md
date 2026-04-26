# W3Booster — UI Plan

> The *how* of the vision in `PRODUCT-VISION.md`. This file describes the
> information architecture, routes, components, and migration order. Update
> when shipping changes the shape.

## 1. Information architecture

The shell is **persona-aware**. After the first-run picker, the user's selected
persona determines what nav items render and which "Hub" is the default
landing. Users can always switch between Player and Streamer from the top-shell
toggle; only the selected persona's options are visible in the rail.

### Streamer mode

```
Stream Hub          ← default landing for streamers
Overlays
  ├─ Library
  └─ Editor (per preset)
Automation
  ├─ Rules
  └─ Event log
Account             ← shared across personas
```

### Player mode

```
Practice Hub        ← default landing for players
Build Orders
  ├─ Library
  └─ Editor (per build)
Match Insights
  ├─ Replays
  ├─ Replay detail (per replay)
  ├─ Trends
  └─ Goals
Account
```

### Developer facet

If `user.settings.developer === true`, an extra `Developers` item appears in
the rail (independent of player/streamer choice). It surfaces API keys, usage
stats, and a link to the public dev portal.

## 2. Routes

### Public

| Path | Page | Notes |
|---|---|---|
| `/` | redirect to `/web` | |
| `/web` | Landing | Hero + 3 persona entry cards (player / streamer / dev) |
| `/login` | Twitch login | Card-style on the new theme |
| `/gift` | Gift Pro | Pick recipient by handle |
| `/gift/:handle` | Gift Pro (preset) | Recipient locked, sender flow only |
| `/developers` | Developer portal | Quickstart, endpoints, code samples |
| `/p/:handle` | Public profile | Streamer = "now playing"; player = stats |
| `/styleguide` | Living styleguide | Internal, but unauthenticated |

### Authenticated dashboard (`/dashboard`)

| Path | Page | Persona |
|---|---|---|
| `/dashboard` | Persona-routed home | redirects → `/dashboard/stream` or `/dashboard/practice` |
| `/dashboard/stream` | Stream Hub | streamer |
| `/dashboard/practice` | Practice Hub | player |
| `/dashboard/overlays` | Overlay library | streamer |
| `/dashboard/overlays/editor/:id` | Overlay editor | streamer |
| `/dashboard/build-orders` | Build orders | player |
| `/dashboard/insights` | Match Insights | player |
| `/dashboard/insights/replay/:id` | Replay detail | player |
| `/dashboard/automation` | Automation | streamer |
| `/dashboard/account` | Account | all |
| `/dashboard/developers` | Developers (in-app) | dev facet only |
| `/dashboard/legacy` | Legacy fat dashboard | fallback during migration |

`PersonaGuard` redirects users away from routes outside their persona.

## 3. Component inventory

### Shell

- `ShellComponent` — chrome (brand, top nav, status cluster) + side rail +
  child router-outlet.
- `PersonaToggleComponent` — always-visible Player / Streamer switch in the
  shell cluster.
- `NotificationBellComponent` — bell with badge; opens a panel of unread
  notifications (gifts received, automation rule errors, replay analyzed).
- `RecorderStatusChipComponent` — extracted from current dashboard chrome.

### Page-level (one component per dashboard route)

- `StreamHubPageComponent` — setup checklist, OBS embed URL, live overlay
  health, win-probability preview, recent auto-clips, story-so-far card.
- `PracticeHubPageComponent` — weekly digest summary, current goals,
  drift diagnoses, last replay summary, drill suggestion.
- `OverlayLibraryPageComponent` — preset cards with thumbnails + URL
  copy + open in editor.
- `OverlayEditorPageComponent` — canvas with snap grid, widget palette,
  per-widget config panel, live preview.
- `BuildOrdersPageComponent` — wraps existing build-orders functionality
  during migration; eventually re-skinned end-to-end.
- `InsightsPageComponent` — replay list with thumbnails + key stat.
- `ReplayDetailPageComponent` — timeline, charts, cohort percentiles,
  drill-this-weakness CTA.
- `AutomationPageComponent` — rule list + event log tab.
- `RuleEditorComponent` — when/condition/then visual builder.
- `AccountPageComponent` — profile, Pro status, gift CTAs, gifts received,
  Discord, notifications prefs, API keys (if dev facet on).
- `DevelopersPageComponent` — API key table + usage chart + portal link.

### Public

- `LandingPageComponent` — refreshed hero with persona entry cards.
- `LoginPageComponent` — re-skinned login.
- `GiftPageComponent` — recipient lookup → duration → message → checkout.
- `DeveloperPortalPageComponent` — overview + quickstart + code samples.
- `PublicProfilePageComponent` — streamer/player public profile.

### Onboarding

- `PersonaPickerModalComponent` — two cards: Player / Streamer. It explains
  the difference and states that users can switch later from the top toggle.
  Triggered by `PersonaService` when no persona is set.

### Shared widgets (used across pages, all design-system based)

- `ProLockComponent` — wraps content, blurs/tints it when Pro is required and
  shows lock badge + inline upsell. Has `[teaser]` slot.
- `ChecklistComponent` — interactive setup checklist used by both Hubs.
- `LiveStatComponent` — animated number with trend chip.
- `WinProbGaugeComponent` — gauge showing live win probability.
- `BuildDriftChartComponent` — your build vs. canonical, side by side.
- `CohortPercentileBarComponent` — your value, cohort distribution,
  percentile.

## 4. Mocking strategy

We are building the entire UI ahead of the backend. Until features land:

- A single `MockDataService` returns realistic seed data:
  - 6 sample replays with timelines, charts, percentiles.
  - 4 overlay presets (one is the built-in Quick preset).
  - 3 automation rules + a mock event log.
  - 2 received gifts.
  - 5 sample notifications.
  - Recorder state mock for non-desktop.
- The service is a single Angular provider. Real services later replace it
  one method at a time without touching consumers.
- Pro state respects `user.isProPlan()` from the existing model — the lock
  rendering is real, only the data behind it is fake.
- Every page component injects `MockDataService` as a temporary dependency
  named `data` so future grep is easy: `private data: MockDataService`.

## 5. Persona service

A single source of truth for the persona state.

```ts
type Persona = 'player' | 'streamer';

interface PersonaState {
  persona: Persona | null;       // null = first-run picker should fire
  developer: boolean;            // facet
}
```

- Persisted via the existing `User.settings` field if available, else
  localStorage with `w3b.persona.*` keys. Migration plan: when a backend
  field exists, sync localStorage → backend on next save.
- Old stored `both` values are migrated to the last active focus when present,
  otherwise to `player`.
- Exposes `state$: Observable<PersonaState>` and helpers `isPlayer()`,
  `isStreamer()`, `isDev()`, `setPersona(p)`.
- Drives:
  - Initial dashboard redirect (`/dashboard` → home for active persona).
  - Side-rail item visibility.
  - `PersonaGuard` for off-persona routes.
  - First-run picker trigger.

## 6. Pro feature handling

- `ProLockComponent` is the canonical wrapper. Pages compose it instead of
  reimplementing locks.

```html
<bn-pro-lock feature="cohort-percentile">
  <ng-template #teaser>
    <!-- shadow-rendered preview of the locked feature -->
  </ng-template>
  <!-- real content rendered when Pro -->
</bn-pro-lock>
```

- The `feature` slug is a stable identifier we can use for analytics ("how
  often is feature X being teased vs. converted?") and for the trial system
  later.
- A small "Or have a viewer gift it" link sits inside every lock CTA, deep
  linked to `/gift/:userHandle`.

## 7. Notifications

A first-class surface. The bell in the shell shows unread counts; clicking
opens a panel anchored under it.

Notification types in v1:
- `gift.received` — extends Pro for N days from sender (or anonymous).
- `replay.analyzed` — your latest replay is ready to review.
- `automation.error` — a rule failed.
- `pro.expiring` — your Pro subscription expires in 7/3/1 days.
- `system` — general announcements.

Each notification has `id`, `type`, `title`, `body`, `createdAt`, `read`,
`cta?` (route or external URL). Service interface is mockable now.

## 8. Migration order (smallest steps that ship value)

1. **Stage 1 (this PR).** Vision + UI plan docs (this document and
   `PRODUCT-VISION.md`).
2. **Stage 2.** PersonaService + MockDataService + new shell with persona-aware
   nav, persona picker modal, all new pages mocked behind feature routes.
   The legacy dashboard remains accessible at `/dashboard/legacy` so nothing
   regresses.
   - Implemented: `PersonaService`, `MockDataService`, `PersonaGuard`, new
     dashboard shell, notification bell, recorder chip, persona toggle,
     persona picker, Pro lock, and mocked dashboard pages.
   - Updated: Player/Streamer are the only persona modes; the shell toggle is
     always visible and the rail only shows the selected persona.
3. **Stage 3.** Public landing redesign + login redesign + public gift +
   public developer portal. These have no functional dependency on the new
   shell, so they ship in parallel.
   - Implemented: refreshed `/web`, refreshed `/login`, public `/gift`,
     `/gift/:handle`, `/developers`, and `/p/:handle` route shells.
4. **Stage 4.** Pull the existing build-orders / overlay-config logic out of
   the legacy dashboard into the new page components, one at a time.
   - In progress: `/dashboard/build-orders` now uses the legacy local storage
     and share-code model. `/dashboard/overlays` now exposes the existing
     player and OBS Quick preset settings plus the current browser-source URL.
5. **Stage 5.** Wire mocked features to real backends behind feature flags,
   one at a time. Drop mock methods as they get replaced. Eventually delete
   the legacy dashboard.
   - In progress: account-level external account linking lets one W3Booster
     account connect Twitch and Battle.net identities. Gift Pro lookup uses
     connected Twitch handles and checkout supports PayPal and Stripe.

## 9. Open questions (intentional unknowns)

- **Does the Developer facet auto-enable on first API key creation?** Probably
  yes — fewer settings to find.
- **How do we surface trials?** Most likely a one-shot ribbon on the locked
  feature ("Try free for 7 days") plus a banner counter. Decide in Stage 5.
- **Public profile content for non-streamers?** Possibly hidden by default
  (personal stats are sensitive). Default to opt-in.
