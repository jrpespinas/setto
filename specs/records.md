# Spec: Records — Leaderboard & Match History

> **Scope** — The `/records` route. A retrospective analytics view the QM consults between or after sessions. Two tabs: **Leaderboard** (ranked player performance) and **History** (chronological match log). Both are read-only; no mutations originate here.

## 1. Domain Model

### MatchRecord (new)
```ts
type MatchRecord = {
  id: string;
  courtNumber: number;
  sideA: { playerId: string; name: string }[];
  sideB: { playerId: string; name: string }[];
  winner: "A" | "B" | "none";
  durationMs: number;
  completedAt: number;   // ms epoch
};
```

Appended to `session.matches[]` by `finishMatch` at the moment of completion. Player names are **snapshot-stored** so records survive player removal or rename.

### Player additions
```ts
// added to existing Player type
wins:   number;   // incremented when player's side wins
losses: number;   // incremented when player's side loses
```

`draws` are not tracked — only `gamesPlayed`, `wins`, `losses`. Win rate = `wins / gamesPlayed` (0 when `gamesPlayed === 0`).

### Session addition
```ts
// added to Session type
matches: MatchRecord[];
```

Initialised as `[]` in `seed()`. Never truncated by `resetAll` variants — only by "Clear Session" full reset.

---

## 2. Layout

```
/records
├─ Nav (shared top bar)
├─ Tab bar: [ Leaderboard | History ]
└─ Tab content (full remaining height, scrollable)
```

Tab bar is sticky below the global nav. Content area is `overflow-y-auto`. No sidebar, no queue — full-width read-only.

---

## 3. Leaderboard Tab

### 3.1 Sort & Grouping

Players are ranked by **win rate** (desc), then **wins** (desc), then **gamesPlayed** (desc). Players with `gamesPlayed === 0` are listed last in an unranked section separated by a hairline.

### 3.2 Row anatomy

```
│ #  ♂ Name [LVL]   Xg   X W   X L   XX%  │
```

| Column     | Detail                                                         |
|------------|----------------------------------------------------------------|
| Rank `#`   | 1-based, mono digit. Shared rank on equal win rate + wins.     |
| Gender     | `Mars` / `Venus` icon, color-coded.                            |
| Name       | `font-display font-semibold`, truncated.                       |
| Level chip | Same shorthand chips as sidebar.                               |
| Games `Xg` | Total `gamesPlayed`.                                           |
| Wins `X W` | `text-neon` when > 0.                                          |
| Losses `X L` | `text-alert` when > 0.                                       |
| Win rate   | Percentage, 0 decimal places. `—` when `gamesPlayed === 0`.    |

### 3.3 Filters

A compact filter bar above the table (same pill pattern as the sidebar):

| Filter | Options |
|---|---|
| Level | All · BEG · L-INT · INT · U-INT · ADV · PRO |
| Gender | All · ♂ · ♀ |
| Min games | All · 1+ · 3+ · 5+ (hides unranked zero-game players) |

Filters compose multiplicatively. No search input (names are few enough to scan).

### 3.4 Empty state

`"No matches recorded yet."` centred, mono, when `session.matches.length === 0`.

---

## 4. History Tab

### 4.1 Match log

Chronological list, **most recent first**. Each row is a match card:

```
┌───────────────────────────────────────────┐
│  Court 01 · 12m 34s            2h ago     │
│  Side A: Alice, Bob      ←W               │
│  Side B: Carol, Dave                      │
└───────────────────────────────────────────┘
```

| Element          | Detail                                                               |
|------------------|----------------------------------------------------------------------|
| Court + duration | `Court XX · M:SS`. Duration from `durationMs`.                       |
| Timestamp        | Relative (`2h ago`, `just now`) from `completedAt`.                  |
| Side A / B names | Player name snapshots from `MatchRecord`. Truncated on overflow.     |
| Winner indicator | `← W` or `W →` neon label on the winning side. `Draw` when `"none"`. |

### 4.2 Filters

| Filter | Options |
|---|---|
| Outcome | All · Win · Draw |
| Court | All · Court 01 · Court 02 … (dynamic from match records) |
| Date | All · Today · This session (same `session.startedAt`) |

### 4.3 Empty state

`"No matches recorded yet."` centred, mono.

### 4.4 Match count summary

Above the list: `"X matches · total play time Y"` where Y = sum of all `durationMs` formatted as hours and minutes.

---

## 5. Data Flow

- `finishMatch(courtId, winner)` in the store **appends** a `MatchRecord` to `session.matches` and increments `player.wins` or `player.losses` based on `winner`.
- `restoreSession(prev)` rolls back `matches` and player stats atomically (standard undo pattern).
- Records page subscribes to `session.matches` and `session.players` via Zustand selectors — no local state needed beyond tab and filter selection.

---

## 6. Acceptance Criteria

1. Leaderboard ranks all players with `gamesPlayed > 0` by win rate → wins → games.
2. Players with zero games appear in an unranked section below the ranked list.
3. Shared ranks are displayed correctly (two players at 75% both show `#1`; next is `#3`).
4. Every `finishMatch` call creates one `MatchRecord` and updates the relevant players' `wins`/`losses`.
5. History shows matches most-recent-first; winner is visually distinct.
6. Filters on both tabs compose multiplicatively; clearing all filters restores the full list.
7. Undo from the Floor's "Finish match" toast rolls back both the `MatchRecord` and player stats.

---

## 7. Constraints

- Records are **session-scoped** — cleared with "Clear Session". No cross-session persistence yet.
- Player name in `MatchRecord` is a snapshot; it does not update if the player is renamed.
- No win/loss tracking for `"none"` (draw) outcomes — only `gamesPlayed` increments.
- No pagination — all records in one scrollable list. Acceptable for typical session sizes (< 100 matches).

---

## 8. Implementation Pointers

| Concern             | File                                              |
|---------------------|---------------------------------------------------|
| Records page shell  | `src/app/records/page.tsx`                        |
| Leaderboard tab     | `src/components/records/leaderboard.tsx`          |
| History tab         | `src/components/records/match-history.tsx`        |
| Store actions       | `src/lib/store/index.ts` (`finishMatch` updated)  |
| Types               | `src/lib/types.ts` (`MatchRecord`, `Session.matches`, `Player.wins/losses`) |
