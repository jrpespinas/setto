# Spec: Roster — Player Management Table

> **Scope** — The `/roster` route. A full-width admin table of all players in the session. Complements the sidebar (which is operational and session-scoped) with a structured, sortable, filterable management view. All mutations available in the sidebar are also available here.

## 1. Distinction from Player Sidebar

| Concern                | Sidebar (`/`)                     | Roster (`/roster`)               |
|------------------------|-----------------------------------|----------------------------------|
| Purpose                | Assign players to courts in real time | Manage roster, review stats     |
| Layout                 | 15% rail, vertical card list      | Full-width sortable table        |
| Visible columns        | Status, name, level, timer        | All fields + wins/losses/win rate |
| Sort                   | Fixed priority (active → resting) | User-selectable column sort      |
| Context                | Live session ops                  | Admin / between sessions         |

---

## 2. Layout

```
/roster
├─ Nav (shared top bar)
├─ Toolbar: [Search] [Filters ▾] [+ Add Player]      ← sticky
└─ Table (full remaining height, overflow-y-auto)
```

No sidebar, no queue. Full-width content area.

---

## 3. Toolbar

### 3.1 Search
- Same substring match as sidebar search (`player.name`, case-insensitive).
- Clears with ×.

### 3.2 Filter panel (collapsible dropdown below toolbar)

| Filter   | Options                                                         |
|----------|-----------------------------------------------------------------|
| Level    | All · BEG · L-INT · INT · U-INT · ADV · PRO                    |
| Gender   | All · ♂ · ♀                                                     |
| Status   | All · Idle · Waiting · Playing · Resting · Done                 |
| Payment  | All · Paid · Unpaid                                             |

Active-filter count badge on the "Filters" button (same pattern as sidebar).

### 3.3 Add Player
- Same `AddPlayerDialog` used in the sidebar — no duplicate implementation.

---

## 4. Table

### 4.1 Columns

| Column       | Key              | Sortable | Default sort |
|--------------|------------------|----------|--------------|
| #            | row index        | —        | —            |
| Name         | `name`           | ✓        | —            |
| Gender       | `gender`         | ✓        | —            |
| Level        | `level`          | ✓        | —            |
| Status       | `status`         | ✓        | —            |
| Games        | `gamesPlayed`    | ✓        | —            |
| Wins         | `wins`           | ✓        | —            |
| Losses       | `losses`         | ✓        | —            |
| Win Rate     | computed         | ✓        | desc (default sort) |
| Avg Wait     | `statusSince`    | ✓        | —            |
| Payment      | `paid`           | ✓        | —            |
| Actions      | —                | —        | —            |

Default sort: **win rate descending**, then **gamesPlayed descending**.

### 4.2 Row anatomy

```
│ N  ♂  Alice  [INT]  [Playing]  4g  3W  1L  75%  2:14  [Paid]  ⚙ │
```

| Element     | Detail                                                                   |
|-------------|--------------------------------------------------------------------------|
| Index       | 1-based, reflects current sort.                                          |
| Gender icon | `Mars` / `Venus`, color-coded.                                           |
| Name        | `font-display font-semibold`, truncated with tooltip on hover.           |
| Level chip  | Shorthand, level-tinted.                                                 |
| Status chip | Color-coded: neon (`playing`/`waiting`), cold (`break`), alert (`done`). |
| Games       | `Xg` mono. Hidden when 0.                                                |
| Wins        | `X W`, `text-neon` when > 0.                                             |
| Losses      | `X L`, `text-alert` when > 0.                                            |
| Win rate    | `XX%`, `—` when 0 games.                                                 |
| Avg Wait    | `formatShortDuration(tick - statusSince)`. Hidden for `done` players.    |
| Payment     | `Paid` chip (neon-muted) or `Unpaid` chip (alert).                       |
| Actions (⚙) | Same cog popup as sidebar: Edit · Set Idle · Set Resting · Set Done · Mark Paid/Unpaid · Remove. |

### 4.3 Row status rail
2px left border matching sidebar status colours (`bg-neon`, `bg-cold`, `bg-alert`).

### 4.4 Column sort
Click column header to sort asc; click again to sort desc. Active sort column shows ↑ or ↓ indicator.

---

## 5. Actions

All actions mirror the sidebar exactly — same store calls, same `ConfirmDialog` for destructive ops, same Undo toast pattern.

| Action            | Trigger                | Effect                                        |
|-------------------|------------------------|-----------------------------------------------|
| Edit player       | Cog → Edit             | Opens `EditPlayerDialog`                      |
| Set Idle          | Cog → Set Idle         | `setStatus(id, "idle")` + Undo toast          |
| Set Resting       | Cog → Set Resting      | `setStatus(id, "break")` + Undo toast         |
| Set Done          | Cog → Set Done         | `ConfirmDialog` → `setStatus(id, "done")`     |
| Mark Paid/Unpaid  | Cog → Mark Paid        | `togglePaid(id)` + Undo toast                 |
| Remove            | Cog → Remove           | `ConfirmDialog` (danger) → `removePlayer(id)` |

---

## 6. Empty States

| Condition                    | Message                                     |
|------------------------------|---------------------------------------------|
| No players in session        | `"No players yet. Add one to start."`       |
| No players match filters     | `"No players match the current filters."`   |

---

## 7. Acceptance Criteria

1. Table renders all session players; updates live when store changes (Zustand subscription).
2. Sort is stable: clicking the same column toggles asc/desc; default is win rate desc.
3. Filters compose multiplicatively with search.
4. All cog menu actions produce identical outcomes to the sidebar equivalents.
5. Add Player from toolbar uses the same dialog and deduplication logic.
6. Win rate displays `—` for players with 0 games.
7. The live timer column (`Avg Wait`) updates every second via a single `setInterval` in the page component (no per-row intervals).

---

## 8. Constraints

- No inline editing — all edits go through `EditPlayerDialog`.
- No bulk select/delete in v1.
- No export (CSV etc.) in v1.
- A single 1s `setInterval` drives the Avg Wait column. Same pattern as the sidebar.

---

## 9. Implementation Pointers

| Concern         | File                                         |
|-----------------|----------------------------------------------|
| Roster page     | `src/app/roster/page.tsx`                    |
| Table component | `src/components/roster/player-table.tsx`     |
| Toolbar         | `src/components/roster/roster-toolbar.tsx`   |
| Reused dialogs  | `src/components/dialogs/` (no new dialogs)   |
| Store           | No new actions — reuses sidebar store calls  |
