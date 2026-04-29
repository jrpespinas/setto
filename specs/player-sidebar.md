# Spec: Player Sidebar

> **Scope** — The right-hand 15% sidebar: roster CRUD, search/filter, sort priority, and the per-player action menu. Players from this list are draggable into court and queue slots throughout the app.

## 1. Domain Model

### Player
```ts
type Player = {
  id: string;
  name: string;
  gender: "male" | "female";
  level: Level;             // 6-tier ranking
  status: PlayerStatus;     // "idle" | "waiting" | "playing" | "break" | "done"
  paid: boolean;
  arrivedAt: number;        // ms epoch — first sign-in
  statusSince: number;      // ms epoch — start of current wait/play period
  gamesPlayed: number;
};
```

### Levels (6 tiers)
`beginner` · `low-intermediate` · `intermediate` · `upper-intermediate` · `advanced` · `professional`

Sidebar cards show shorthand (`BEG`, `L-INT`, `INT`, `U-INT`, `ADV`, `PRO`). Dialogs use full labels.

### Status semantics
| Status   | Meaning                                                         |
|----------|-----------------------------------------------------------------|
| `idle`   | Available, waiting for next match                               |
| `waiting`| Assigned to a queue slot (pending match)                        |
| `playing`| On a court mid-match                                            |
| `break`  | Resting; preserves accumulated wait timer                       |
| `done`   | Left for the day; lingers only if `paid === false`              |

## 2. Layout

A flat, unified scrollable list — **not** three collapsible sections. There is one header, one filter panel, one search input, and one ordered list (`<ol>`) of player cards.

```
┌─────────────────────────┐
│ [N] Players      + Add  │  header
│ [search input        ×] │
│ [⚙ Filters (count)]     │  collapsible filter panel
├─────────────────────────┤
│  player card             │
│  player card             │
│  …                       │  scrollable
└─────────────────────────┘
```

- Width: `xl:[grid-template-columns:_85fr_15fr]`. Min-width `240px`.
- Background: `bg-ink-050` with a `rule-left` hairline.
- The list is the sole `overflow-y-auto` container — header pins above.

## 3. Sort Order (single ordered list)

Players are partitioned into three groups, concatenated in order:

1. **Active** — `status ∈ {idle, playing, waiting}`. Sort by fewest `gamesPlayed`, then earliest `statusSince` (longest wait first).
2. **Resting** — `status === "break"`. Same sort key as Active. Rendered at 50% opacity.
3. **Done & unpaid** — `status === "done" && !paid`. Sorted by `arrivedAt`. Paid `done` players are not shown (they are auto-removed; see §6.3).

The ordering is recomputed via `useMemo` keyed on `session.players` plus filter inputs. The sidebar passes a single shared `tick` (1 s `setInterval`) down to cards — there is **no** per-card timer.

## 4. Search & Filters

### 4.1 Search
- Single text input; case-insensitive substring match against `player.name`.
- × button clears; otherwise shows search icon at right edge.

### 4.2 Filter panel (collapsible)
Toggled by a "Filters" pill button that displays the active-filter count badge.

| Row    | Options                                                          |
|--------|------------------------------------------------------------------|
| Lvl    | All · Beginner · L-Int · Int · U-Int · Adv · Pro                 |
| Sex    | All · ♂ · ♀                                                      |
| Status | All · Idle · Resting · Playing · Done                            |
| Pay    | All · Paid · Unpaid                                              |

- "Status: Playing" matches both `playing` **and** `waiting` (queue counts as playing for filter purposes).
- "Clear all" link appears in the panel when ≥1 filter is non-`all`.

## 5. Player Card

```
│ N ♂ Name [LVL]  [Unpaid?]    Xg  Mm  ⚙ │
```

| Element        | Details                                                           |
|----------------|-------------------------------------------------------------------|
| Index `N`      | Mono digit, 1-based, no zero-padding. Reflects current sort.      |
| Gender icon    | `Mars` / `Venus` 12px, color-coded via `g-male` / `g-female`.     |
| Name           | `font-display font-semibold text-[15px]`, truncated.              |
| Level chip     | Shorthand label, level-tinted background.                         |
| Unpaid badge   | `Unpaid` mono text in `text-alert` — only when `done && !paid`.   |
| Games          | `Xg` mono, hidden when `gamesPlayed === 0`.                       |
| Timer          | `formatShortDuration(tick - statusSince)` — hidden while `playing`/`waiting`/`done`. |
| Cog (⚙)        | `Settings2` icon — opens the action menu.                         |

### 5.1 Status rail (2 px left border)
| Status                 | Class       |
|------------------------|-------------|
| `playing` / `waiting`  | `bg-neon`   |
| `break`                | `bg-cold`   |
| `done`                 | `bg-alert`  |
| `idle`                 | (none)      |

### 5.2 Background tint (idle players only)
Computed from `waitMs / avgWaitMs`:
- `≤ 0.75` → no tint.
- `0.75 – 1.5` → warm tint, alpha ramps `0 → 0.10`.
- `> 1.5` → alert tint, alpha ramps `0.10 → 0.18`.

`playing` / `waiting` cards always show a faint neon tint (`rgba(0,223,192,0.08)`).

### 5.3 Drag behaviour
- Only `idle` players are `draggable`. Other statuses preflight-cancel the drag.
- On drag start, `document.body` gets a `dragging` class (used to dim drop targets globally).
- DataTransfer payload: `text/player-id`.

## 6. Action Menu (cog popup)

Clicking the cog opens a `position: fixed` popup positioned via `getBoundingClientRect()`. Fixed positioning is required so the menu **escapes the parent's `overflow-y-auto`** clipping. Outside-click (mousedown) closes it.

### 6.1 Menu items
| Item                  | Visible when                       | Effect                                                                 |
|-----------------------|------------------------------------|------------------------------------------------------------------------|
| Edit player           | always                             | Opens `EditPlayerDialog`                                               |
| → Set Idle            | `status !== "idle"`                | `setStatus(id, "idle")` + Undo toast                                   |
| → Set Resting         | `status !== "break" && !done`      | `setStatus(id, "break")` + Undo toast                                  |
| → Set Done            | `status !== "done"`                | Opens `ConfirmDialog` "Mark as done?" → `setStatus(id, "done")`        |
| Mark Paid / Unpaid    | always                             | `togglePaid(id)` + Undo toast                                          |
| Remove                | always (alert color)               | Opens `ConfirmDialog` "Remove player?" `danger` → `removePlayer(id)`   |

**No inline `Yes/No` confirm rows.** All destructive actions go through the modal `ConfirmDialog` to prevent double-click misfires.

### 6.2 Undo pattern
Every action snapshots `useStore.getState().session` *before* mutating, then surfaces a Sonner toast with an Undo button calling `restoreSession(prev)`.

### 6.3 Auto-removal
- Marking a `done` player paid → player is **deleted** from the session (paid + done is fully resolved, so the row would just be visual noise).
- Setting an already-paid player to `done` → same auto-deletion.

## 7. Add / Edit Dialogs

### 7.1 Add Player
- Defaults: `Intermediate`, `Unpaid`.
- Name input autofocuses (`120ms` timeout to defeat mobile suppression).
- Level options use **full labels** in a 2-column grid.
- Duplicates are silently rejected (`addPlayer` returns `false`); identity key = `name.toLowerCase() :: level :: gender`.

### 7.2 Edit Player
- Editable: name, gender, level. No status, no payment, no `gamesPlayed`.
- Same level-grid as Add Player.

## 8. Level Chip Palette (sidebar)

| Level                | Tier      | Tone                                  |
|----------------------|-----------|---------------------------------------|
| Beginner             | Bronze    | warm amber bg, gold text              |
| Low-Intermediate     | Silver    | cool grey-blue bg, silver text        |
| Intermediate         | Gold      | deep amber bg, bright gold text       |
| Upper-Intermediate   | Platinum  | cyan-steel bg, sky text               |
| Advanced             | Diamond   | deep blue bg, bright blue text        |
| Professional         | Legend    | violet bg, purple text                |

Sidebar chips are semi-transparent (~0.60 opacity) — the higher contrast variant lives on the court surface (see `courts.md` §6.4).

## 9. Edge Cases

| Case                                            | Behaviour                                                                |
|-------------------------------------------------|--------------------------------------------------------------------------|
| Duplicate add                                   | Rejected silently (`addPlayer` returns `false`); UI shows no error toast |
| Empty roster                                    | Sidebar shows `"No players yet.\nAdd one to start."`                     |
| Empty filter result                             | Sidebar shows `"No players match."`                                      |
| Idle ↔ Break transition                         | `statusSince` preserved — accumulated wait time carries through          |
| Re-entering from `done`                         | `statusSince` reset on `setStatus`                                       |
| Removing a player on a court / queue            | `removePlayer` releases them from both via `releaseFromCourts/Queue`     |
| Filter panel + clear button                     | "Clear all" only renders when `activeFilterCount > 0`                    |

## 10. Acceptance Criteria

1. Sidebar renders one flat list; players auto-resort when state changes (no manual refresh).
2. Filters compose multiplicatively; "Status: Playing" matches both `playing` and `waiting`.
3. Drag works only from `idle` cards; non-idle cards preflight-cancel.
4. Set Done and Remove use modal `ConfirmDialog`; no inline `Yes/No` row exists in the menu.
5. Outside-click closes the cog menu; the menu remains positioned correctly when the sidebar scrolls (fixed positioning).
6. Marking a `done` player paid removes them from the session.
7. Wait timer is **not reset** on idle ↔ break transitions; it **is** reset on re-entry from `done`.
8. Background tint on idle cards reflects wait urgency vs. session average.
9. All destructive actions are undoable from the toast.

## 11. Constraints

- A player exists in exactly one of: sidebar, court slot, queue slot. Enforced by `releaseFromCourts` / `releaseFromQueue` on every assignment.
- A single 1 s `setInterval` in `PlayerSidebar` drives all card timers. **No per-card intervals.**
- Cog menu must use `position: fixed` so it escapes the sidebar's `overflow-y-auto` clipping.
- Level chips in cards use **shorthand**; dialogs use **full labels**.
- No win/loss tracking. `gamesPlayed` is the only match-related counter on a player.

## 12. Implementation Pointers

| Concern             | File                                                            |
|---------------------|-----------------------------------------------------------------|
| Sidebar shell       | `src/components/sidebar/player-sidebar.tsx`                     |
| Player card         | `src/components/sidebar/player-card.tsx`                        |
| Add dialog          | `src/components/dialogs/add-player-dialog.tsx`                  |
| Edit dialog         | `src/components/dialogs/edit-player-dialog.tsx`                 |
| Confirm dialog      | `src/components/dialogs/confirm-dialog.tsx`                     |
| Store actions       | `src/lib/store/index.ts` (`addPlayer`, `updatePlayer`, `removePlayer`, `setStatus`, `togglePaid`, `restoreSession`) |
