# Spec: Metric Bar

## Summary
A persistent top-bar command centre with three zones reading left-to-right: operational status → player flow → administrative. All primary values use a unified `big-number digit` (40px) treatment for visual consistency. **Hidden on mobile (< 768px)** — tablets and desktop only.

## Zone Layout

### Zone 1 — Courts (Operations)
*Dominant tier (`bg-neon-ghost`). What is happening on the court right now.*

| Metric | Display | Logic |
|---|---|---|
| **Active Courts** | `2/3` ratio | Active = courts with at least 1 player on each side. Active number colored neon when > 0, muted (bone-3) when 0. |
| **Next Free Court** | Court number + elapsed time | Vacant courts are prioritized, sorted ascending by court number. Falls back to the longest-running active court only when all courts are occupied. Shows `--` if no courts exist. Elapsed time (e.g. `8m 12s`) shown below the court number when the court is still ongoing; hidden when the court is already vacant. |

### Zone 2 — Players (Player Flow)
*Full-width dot-matrix wait chart. Shows distribution, count, and outlier identity in one view.*

**Unified Wait Chart** — Nothing OS-inspired dot matrix:
- **Columns**: one per waiting player (Idle + Waiting statuses), sorted ascending left-to-right by wait time (shortest left → longest/outlier right).
- **Dots per column**: 6 rows fixed height (5px diameter, 2px gap, 40px total). Ghost dots (unfilled, `var(--hairline-2)`) fill from the top; filled dots rise from the bottom proportional to the player's wait relative to the longest waiter.
- **Dot fill color** (progressive, per column):
  - `var(--bone-3)` — within tolerance
  - `var(--warm)` — deviation from avg > 1× tolerance
  - `var(--alert)` — deviation from avg > 2× tolerance
  - Tolerance = one game cycle (13 min) ÷ number of active courts.
- **Outlier label**: The rightmost column (longest waiter) always shows the player's name + exact wait time right-aligned above the chart, colored by their fill level.
- **Hover tooltip**: Non-outlier columns reveal a floating name + time tooltip on hover (desktop only, non-interactive).
- **Legend**: `N Waiting` left-aligned below the chart in `font-mono text-[9px] uppercase` style.
- **Empty state**: A single `—` em-dash when no one is waiting.

### Zone 3 — Fees (Admin)
*Administrative tasks — unpaid payment tracking.*

| Metric | Display | Logic |
|---|---|---|
| **Unpaid** | `N` count | Number of players with `paid: false`. Red (`text-alert`) when > 0, muted (bone-3) when 0. |

## Visual Design

- **Font**: `big-number digit` (40px, `leading-[0.85]`) for all primary values across all zones.
- **Labels**: `font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 mt-2` — always below the number.
- **Zone titles**: `font-mono text-[9px] uppercase tracking-[0.28em]` — above the metrics row.
- **Zone 1 background**: `bg-neon-ghost` (subtle neon tint to signal operational importance).
- **Zone separators**: `rule-right` hairline dividers between zones.
- **No collapse toggle**: all zones are always visible (bar is hidden entirely on mobile instead).
- **Zone flex widths**: Courts `flex-1`, Players `flex-[1.4]`, Fees `flex-[0.75]`.

## Responsive Behavior
- **≥ 768px (md)**: metric bar renders above courts and queue.
- **< 768px**: metric bar is hidden entirely (`hidden md:block`) — not collapsed, not shown at all.

## Timing & Updates
- All durations format as shorthand: `12m`, `1h 4m`, etc. (no MM:SS clock format to avoid confusion with match timers).
- A single `setInterval` (1 s) drives all live counters via a shared `tick` value.
- All derived values are computed via `useMemo` keyed on `session` to prevent recalculation on every tick.

## Edge Cases
1. **No waiters**: Chart shows `—`; outlier label area is empty; legend reads `0 Waiting`.
2. **All courts vacant**: Active Courts shows `0/N` in muted color; Next Free Court shows the lowest-numbered vacant court with no elapsed time.
3. **All courts occupied**: Next Free Court falls back to the longest-running active court with its elapsed time shown.
4. **Unpaid = 0**: Count displays in muted bone-3 (subdued) — zero outstanding is a positive state.
5. **Single waiter**: One column fills the chart; they are both the first and the outlier; name+time is always shown.

## Acceptance Criteria
- Chart updates in real time as players enter and leave the waiting pool.
- Next Free Court always shows a vacant court first when one exists.
- Outlier name and time are always visible without any hover interaction.
- Unpaid count turns red when > 0, muted when 0.
- Bar is completely absent on viewports narrower than 768px.

## Constraints
- Read-only: no editing from the metric bar.
- No per-metric intervals — all driven by a single shared tick.
- Must remain flush to the top of the application above courts and queue.
- No win rate, completed match count, or average wait standalone stat.
