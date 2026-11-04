# Luma Control — Groups v1 technical audit and integration status

## Date / branch
2026-11-04, feature/groups-v1 (based on \`feature/scenes-v1\`).

Reason: the previously approved 48-scene library and its fixes already exist in this branch. \`design/immersive-v1\` is a reference/design-document branch, not the latest functional scenes code. Current \`main/index.html\` 0.23 remains unchanged.

## Verified findings in original app
- One 65 KB monolithic \`index.html\` managed UI, Hue v1 REST requests, dynamic scene writes, target IDs, and local group editing.
- \`All\` and Hue \`Wohnzimmer\` were selectable in target tree but **not** in editable group management, which listed only user-created \`luma07_groups\`.
- \`renderTargets()\` only included All, the first Hue room named Wohnzimmer and individual lamps. Custom groups were not reachable from the target dropdown despite being persisted.
- \`resolveGroup()\` recursively expanded local groups but was independent of target tree and treated missing groups as empty.
- Legacy \`luma07_groups\` and \`luma07_order\` were global to the browser (not bridge-scoped), so changing bridges or transferring groups could accidentally mix numeric Hue IDs.
- The previous import appended groups without a complete graph consistency check, allowing cycles to appear in imported data.
- The previous catch-all \`guard()\` stopped motion and navigated to Connection even when the error came from local group validation.
- Hue v1 API endpoints used: \`GET /lights\`, \`GET /groups\`, and per-light \`PUT /lights/{id}/state\`; Hue group music mode uses \`PUT /groups/{id}/action\`. An optional \`GET /config\` now captures the bridge's stable \`bridgeid\` once per connection, falling back to a previously saved ID for the same configured IP or an IP-scoped ID.

## New architecture
- \`groups-v1.js\`: independent core with schema v2, scoped by bridge identity under \`luma_groups_v2\` only. Does not contain network calls or credentials.
- \`groups-v1-ui.js\`: DOM rendering and editing, contains no Hue transport calls.
- \`groups-v1.css\`: Immersive-styled UI, scoped to groups panel.
- \`index.html\` on feature branch: initializes core, resolves *all* target selections through \`Engine.resolve()\`, shares resolved target IDs with current scene renderer and music transport (preserving the Hue REST group short path for native Hue groups). All / Wohnzimmer quick targets, other groups via tree/select; three primary tabs plus settings for Groups and Bridge.
- \`groups-preview/index.html\` on \`main\`: entirely simulated interface with in-memory storage, no Hue API access and no localStorage key use. Separate folder; \`main/index.html\` is not altered.

**Types:** \`system\` (All), \`hue-room\` / \`hue-zone\` read-only membership, and \`luma-local\`. Hue Entertainment and unrelated GroupedLight groups are excluded from editable rooms. A preferred Wohnzimmer is read from a named Hue room before other matching types or local fallback.

**Persistent data:** \`{version:2,bridges:{[bridgeId]:{groups,order,meta,target,migrated}}}\`. Local groups support direct lights, nested group references, per-group order and optional positions. Stable IDs are random \`local:\` identifiers. Existing \`luma07_groups\` and \`luma07_order\` keys are retained, never rewritten; migration happens once per bridge. Invalid legacy group entries are skipped only in the new copy; an invalid legacy graph is flattened in the v2 copy to prevent cycles, with the original kept for recovery. A future enhancement could explicitly surface skipped items in the UI.

**Important:** The local group model deliberately does *not* write to Hue Room/Zone membership. Real Hue room editing must be a separate, explicitly authorized feature. The current model cannot yet synchronize groups between iPhones automatically; it supports scoped JSON v2 export/import. A version 1 backup is importable with explicit user confirmation.

## Implementation facts
- All is computed from the currently connected light map, not a static list.
- Shared target resolver handles individual, real Hue and nested local groups. Unreachable lamps are omitted from commands but not deleted from stored membership.
- UI supports creating, editing, nesting, duplicating, and deleting local groups, and sorting/positioning all and read-only Hue groups.
- Cycle validation and ID validation prevent malformed new/imported graphs.
- Export includes no credentials; v2 imports require the same bridge identity and are validated before storage writes.
- Import conflicts preserve existing group definitions and add missing IDs, rather than silently overwriting. Existing lamp ordering and spatial preferences are only replaced on an explicit positive confirmation during v2 import.
- A deleted local group is also removed from parents, and a selected deleted target falls back to All.
- Local editor errors stay in the editor instead of going through the general Hue connection error handler.
- Music audio analysis and transport loops, scene catalogue and existing bridge credentials were not rewritten.

## Checks performed
- 18 initial in-memory core assertions, then 21 named regressions from \`tests/groups-v1.test.cjs\` executed with a compatible assertion harness inside the available JS tool.
- \`new Function\` syntax checks on \`groups-v1.js\`, \`groups-v1-ui.js\`, \`scenes-v1.js\`, and every inline \`index.html\` script. Checked IDs in feature HTML (111 unique).
- Independent three-tab preview inline-script parsing and duplicate-ID check.
- GitHub CI workflow created to run \`node --test\` and \`node --check\` on new commits; CI result not yet confirmed.

## Tests NOT yet done
- Live physical Hue Bridge Pro; stable bridge ID retrieval on this bridge.
- End-to-end browser DOM and iPhone touch interactions.
- Real-world performance regression of the music transport.
- Old v1 groups and migrations against the user's actual private browser data (not accessible remotely).
- Real Hue Room membership changes (deliberately not implemented).
- Multi-bridge control (schema scaffolding only).
- Native SwiftUI implementation.
- Public GitHub Pages serving of the new preview (separate link was created but external availability could not be confirmed by tooling).

## Review/test path
Mock preview: https://leonvalmeida-cyber.github.io/luma-control/groups-preview/

Test using demo data (not real lights):
1. Settings → Gruppenverwaltung.
2. Open All and change order.
3. Open Wohnzimmer and inspect read-only Hue members and editable order.
4. Create a local group, add lamps and an existing subgroup; save and select it.
5. Switch between light, scenes and music tabs.
6. Try export/import on a fresh browser session if desired (preview resets its in-memory changes on reload).

Do not merge until real iPhone + Hue smoke test and explicit user acceptance. Main 0.23 remains rollback option.

## Group-tree collapse fix — 2026-11-04
- User reported that collapsing groups shifted the page and sometimes showed apparently erroneous entries.
- Cause identified in code: the disclosure button invoked a full `container.replaceChildren()` rebuild, deleting the focused iOS Safari element. In the demo, every lamp selection/toggle also triggered redundant tree rebuilds. The hierarchy additionally repeated some lamps under a subgroup and its parent.
- Fix: create the subtree once, toggle its `hidden` property and `aria-expanded` without destroying the clicked button; update only `aria-pressed`/header on target changes.
- Preserve tree panel geometry with fixed responsive scroll-panel height; avoid page layout shifts on collapse.
- Remove redundant lamp leaves within parent groups and Hue rooms; multiple group membership in the data model remains supported.
- Applied on feature branch and in isolated `main:groups-preview/` files. Productive `main:index.html` unchanged.
- CI passing with 21 named Node regression tests including repeated disclosure and focus-safe DOM checks. Device/real iPhone verification remains open.
