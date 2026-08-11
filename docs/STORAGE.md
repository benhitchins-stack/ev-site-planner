# EV Site Planner: storage model

Last reviewed: Phase 1 stabilisation (July 2026). No key was renamed or
removed in Phase 1; one read was corrected (Project Support, below).

## localStorage keys (planner)

| Key | Contents |
|---|---|
| `evSitePlanner_v1` | Autosave fallback: `{ pack, view, ts }`. Only used when the IndexedDB write fails; the IndexedDB copy is primary. |
| `evsp_projects` | Jobs index, newest first, capped at 30: `[{ id, name, mode, date, thumb, n, cust, ref, units, snags, ready, outcome, rev, go }]` |
| `evsp_proj_<id>` | One saved project: `{ pack, budget }`. If it exceeds quota a slim copy is stored (`photos: []`, `slim: true`) and the full pack lives in IndexedDB. `budget` is the priced-quantities snapshot the Quotes tool imports: `{ lines: [{ k, label, unit, qty, rate, total }], at, name, mode, jobRef, custName }`. |
| `evsp_packsec` | Selected stage (`overview`, `survey`, `design`, `verify`, `price`, `plan`, `install`, `handover`). Legacy section values (`capture`, `job`, `status`, `checks`, `pricing`, `output`) migrate on boot. |
| `evsp_welcomed` | `"1"` once the first-run welcome has been answered. |
| `evsp_brand` | Device default branding `{ name, logo, email, phone }`. |
| `evsp_rates` | Device default pricing rates map. |
| `evsp_wholesaler` | Wholesaler email for the materials list. |
| `cmPmName.v1`, `cmEmailTpl.v1` | Project-manager name and email template overrides. |

## localStorage keys (satellites, read by the planner)

| Key | Owner | Planner usage |
|---|---|---|
| `evqi.tool.v2` | Quotes & Invoices | Linked quotes and invoices via `doc.properties[].plannerRef.projId`; drives the overview quote row, drift banner and chips. |
| `evsp_rams_v1` | RAMS Builder | Linked RAMS via `doc.planId`. Only read when the RAMS gate is on. |
| `evsp_ps_v2` | Project Support | Linked requests via `request.packId`. The planner reads v2 with a v1 fallback; before Phase 1 it read only `evsp_ps_v1`, which the live tool never wrote, so support links never resolved. |
| `evit_business_hub_v1` | Business Hub | Not read by the planner. |

## IndexedDB

Database `evsp_store`, single object store `kv`:

- `autosave`: the primary working-copy snapshot `{ pack, view, ts }`.
- `proj_<id>`: full saved projects (photo-heavy packs that exceed
  localStorage quota). A one-off boot migration moves any oversized legacy
  localStorage project blobs here, leaving slim copies behind.

## The pack

`pack` is the whole project: identity (`name`, `address`, `postcode`,
`custName`, `jobRef`, `projId`), mode, supply details (`earthing`,
`mainFuse`, `supplyRating`, `ze`, `ra`), photos with drawing items, survey
checklist, compliance, CDM, snag sign-off, commissioning records, programme,
attachments, branding and display options. `normalisePack()` is the schema
authority: it fills defaults, migrates legacy values, validates items and is
idempotent. Unknown fields and unknown item types are retained, not dropped
(covered by a regression test).

`projId` is an 8-character base-36 id from `uid()`. It is the join key for
every cross-module link. Preserve it at all costs; satellites match on it
verbatim.

## Autosave and recovery

- Every mutation calls `autosave()` (700 ms debounce) then `autosaveNow()`.
- `autosaveNow()` first ensures the project is registered (assigns `projId`
  via `saveCurrentToProjects` when the pack has content), then snapshots
  `{ pack, view, ts }` to IndexedDB, falling back to localStorage. The order
  matters and is covered by a regression test: snapshotting before the id was
  assigned meant a restored session lost its `projId`, minted a duplicate
  project and orphaned quote links.
- `flushAutosave()` runs on pagehide and visibility change.
- Boot restore: localStorage copy first, then the IndexedDB copy if newer,
  provided the user has not already started editing. Restore requires the
  saved pack to have substance (photos or typed identity). Before Phase 1 it
  required photos, so a field-only project silently vanished from the working
  session on refresh.

## Legacy compatibility

- Saved projects from pre-stage builds load unchanged; `normalisePack()`
  supplies every newer field. A committed fixture
  (`tests/fixtures/legacy-project.json`) locks this in.
- Legacy `evsp_packsec` section values migrate to stages on boot.
- Pack files saved to disk (`Save pack file`) remain compatible both ways:
  they are the same JSON shape.

## Known data-loss risks (accepted, documented)

1. Browser storage is the only store. Clearing site data erases every
   project not exported to a file. The UI positions file export as the
   durable copy.
2. The final debounce window (up to 700 ms) before closing the tab can lose
   the very last edit if the IndexedDB write races the unload. The pagehide
   flush narrows but cannot eliminate this.
3. Quota pressure on photo-heavy packs falls back to slim localStorage
   copies; if IndexedDB is unavailable the full photos exist only in the
   session and exports.
4. Undo history is in-memory only and does not survive reload.
