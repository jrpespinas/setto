# Spec: Metric Bar

## Summary
A persistent top-bar command centre with three conceptual zones reading left-to-right: operational status → player flow → administrative. All primary values use a unified `big-number digit` (40px) treatment for visual consistency. Zones 2 and 3 collapse behind a chevron toggle, leaving only The Floor always visible.

## Zone Layout

### Zone 1 — The Floor (Operations)
*Always visible. Dominant tier (`bg-neon-ghost`). What is happening on the court right now.*

| Metric | Display | Logic |
|---|---|---|
| **Active Courts** | `00/03` ratio | Active = courts with at least 1 player on each side. Total = all courts. Active number colored neon when > 0, muted when 0. |
| **Completed** | `00` count | Total matches finished with a declared winner (Draw / No result does not increment). Persisted in `session.matchesCompleted`. |

### Zone 2 — The Queue (Player Flow)
*Hidden when collapsed. Groups all bottleneck data together.*

| Metric | Display | Logic |
|---|---|---|
| **Waiting** | `00` count | Sum of Idle + Waiting players (all players not on a court or at rest). Amber if vacant courts exist but fewer than 4 players are ready; neon if players are available; muted if none. |
| **Avg Wait** | `12m` duration | Average `statusSince` of all Idle + Waiting players. Shows `--` when no waiters. |
| **Longest Wait** | `12m` + name | The idle player with the earliest `statusSince`. Time display uses progressive color based on deviation from the average, adjusted for court throughput. Player name shown below the time at 12px. |

#### Longest Wait — Progressive Color
- **Tolerance** = one game cycle (13 min) ÷ number of active courts.
- **Excess** = `longestWait − avgWait` (or `longestWait` alone when no average is available).
- **Neutral** (bone): excess ≤ tolerance.
- **Amber** (`text-warm`): excess > tolerance.
- **Red** (`text-alert`): excess > 2 × tolerance.

### Zone 3 — The Desk (Admin & Stats)
*Hidden when collapsed. Administrative tasks and session summaries that don't drive the next match.*

| Metric | Display | Logic |
|---|---|---|
| **Unpaid / Total** | `01/02` ratio | Left (red if > 0): unpaid players. Right: total signed-in players (stable denominator — never changes as players check out). |
| **Top Win Rate** | `75%` + name | Win rate % as the hero number (neon). Player name at 12px below. Requires ≥ 3 games to qualify. Tie-break: win rate → games played → level rank → earliest arrival. Shows `--` when no qualified player. |

## Visual Design

- **Font**: `big-number digit` (40px, `leading-[0.85]`) for all primary values across all zones.
- **Secondary info** (player names below Longest Wait and Top Win Rate): `font-display font-semibold text-[12px] text-bone-2`.
- **Labels**: `font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 mt-2` — always below the number.
- **Zone titles**: `font-mono text-[9px] uppercase tracking-[0.28em]` — above the metrics row.
- **Zone 1 background**: `bg-neon-ghost` (subtle neon tint to signal operational importance).
- **Zone separators**: `rule-right` hairline dividers between zones.
- **Collapse toggle**: 32px button on the far right with a rotating chevron (▾). Collapses Zones 2 and 3; Zone 1 always remains visible.

## Collapse Behavior
- **Expanded** (default): all three zones visible at equal `flex-1` widths.
- **Collapsed**: only Zone 1 (The Floor) visible. Chevron rotates 90° to indicate collapsed state.
- Title: `"Collapse to floor view"` / `"Expand metrics"`.

## Timing & Updates
- All durations format as shorthand: `12m`, `1h 4m`, etc. (no MM:SS clock format to avoid confusion with match timers).
- A single `setInterval` (1 s) drives all live counters via a shared `tick` value.
- All derived values are computed via `useMemo` keyed on `session` to prevent recalculation on every tick.

## Edge Cases
1. **No waiters**: Avg Wait and Longest Wait show `--`; no progressive coloring applied.
2. **No qualified performer**: Top Win Rate shows `--`; name slot is empty.
3. **All courts vacant**: Active Courts shows `00/03` in muted color (not red — absence of play is neutral).
4. **Unpaid = 0**: Left side of ratio is `text-bone-3` (subdued), not alert — zero outstanding is a positive state.
5. **Bottleneck**: Vacant courts > 0 but fewer than 4 players ready → Waiting number turns amber.
6. **Draw finish**: `matchesCompleted` does not increment on "No result" outcomes.

## Acceptance Criteria
- All three zones render with identical number sizing and label placement.
- Collapse/expand toggles Zones 2 and 3 without layout shift.
- Longest Wait updates color in real time as avg wait changes.
- `matchesCompleted` increments correctly on each finish with a winner.
- Unpaid ratio denominator stays stable regardless of player status changes.
- Top Win Rate hides players with fewer than 3 games.

## Constraints
- Read-only: no editing from the metric bar.
- No per-metric intervals — all driven by a single shared tick.
- Must remain flush to the top of the application above courts and queue.
