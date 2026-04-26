# Client Redesign And Build Orders

## Direction

The client should move from an admin-card utility into a launcher-style command center inspired by the 2020 Battle.net desktop launcher: dark layered surfaces, a strong command bar, compact status chips, responsive content panels, and a first-class web mode. The same dashboard route should work in Electron and browser; browser mode must keep account, overlay configuration, subscription, and build-order management, while disabling recorder, local websocket hosting, in-game overlay attachment, and every `w3blib`-backed action.

The normal desktop shell must be resizable and support minimize/maximize/close. Compact mode remains a separate small-game-state layout.

## Build Order UX

Build orders are treated as training programs:

- Library: create, duplicate, delete, import, export/share code, and mark orders as private/shared.
- Metadata: race, matchup, description, and auto-select flag.
- Timeline: ordered steps with game time, action type, target, player-facing instruction, tolerance, and current status.
- Runtime: one active build order streams a compact checklist to the overlay.
- Auto-select: when a match starts, the client picks the best enabled order by player race and matchup.

Current implementation stores build orders locally and uses share codes for transport. The backend sharing model should later promote `visibility: shared` into a Parse class with author, version, race, matchup, title, description, steps, likes/usage, and moderation fields.

## Validation Model

The recorder provides `GAMETIME` and `LOCAL_GAMEDATA`. The first implementation keeps timing state and marks steps as active/late/missed by configured tolerance. Completion is detected by scanning local game-data updates for the step target and action-family tokens.

The production-grade validator should replace token scanning with explicit recorder events:

- `TRAIN_STARTED`, `UNIT_CREATED`
- `BUILD_STARTED`, `BUILD_COMPLETED`
- `UPGRADE_STARTED`, `UPGRADE_COMPLETED`
- `HERO_SKILL_SELECTED`
- `ITEM_PURCHASED`

Each event should include player id, Warcraft raw id, display name, game time, and source object id. Build-order steps should validate against those normalized event types rather than raw snapshots.

## Overlay Contract

The client now sends a local websocket snapshot with `stateType: "buildOrder"`:

```json
{
  "enabled": true,
  "gameTime": 30,
  "order": {
    "id": "bo-...",
    "name": "Human opener drill",
    "race": "human",
    "matchup": "any",
    "completion": 33,
    "steps": []
  }
}
```

The overlay renders the active checklist when this state is present. Future work should add overlay settings for position, scale, visibility, and whether to show only current/next steps or the full timeline.
