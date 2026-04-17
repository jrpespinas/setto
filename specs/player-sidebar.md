# Spec: Player Sidebar

## Summary
A fixed sidebar (15% width) containing the roster of players for the session. Players are organized into three collapsible sections — Idle, Break, and Done — and can be dragged to courts or queue cards from any section. A single unified scroll container with VS Code-style sticky section headers allows the sidebar to scroll while headers snap at the top.

## Functional Requirements
- Player must have: name, gender (male/female), level, status, payment status, win/loss count, and a per-status timer.
- Player levels: beginner, low-intermediate, intermediate, upper-intermediate, advanced, professional.
- Player statuses: idle, waiting, playing, break, done.
- **All players (Idle, Break, Done) are draggable** to a `<court>` slot or `<queue>` card slot. No restriction based on status.
- The sidebar has three sections: Idle, Break, Done.
  - **Idle Section**: Players sorted by fewest games played, then longest wait (earliest `statusSince`), then earliest arrival.
  - **Break Section**: Player timer continues accumulating. Timer is preserved when moving between Idle ↔ Break — `statusSince` is not reset on idle/break transitions, only when entering a completely different status (playing, waiting, done).
  - **Done Section**: Payment status is visible and togglable via the hover overlay. Unpaid players show a pulsing red status rail.
- Each section is collapsible via its header button. Collapsed sections snap as a thin strip at the top (VS Code-style sticky headers) — the section header remains visible and pinned while scrolling.
- **Unified scroll**: A single `overflow-y-auto` container wraps all three sections. Section headers use `sticky top-0 z-10` to pin in place as the user scrolls.
- A persistent filter input at the top of the sidebar allows filtering players by name across all sections simultaneously.
- Players can be added via the **+ Add** button which opens the **Add Player** dialog.

## Masthead
- Single combined heading: `[NN] Players` where NN is the total signed-in player count, zero-padded to 2 digits.
- No separate eyebrow labels or secondary counters — count and label are inline.

## Player Card Layout
- **Name row**: `♂/♀` gender icon (color-coded) · player name (bold) · level chip (ranking color) — all inline, left-aligned.
- **Stats row**: `Xg · Xw/Xl · X%` win rate (shown when non-null).
- **Status rail**: 2px vertical strip on the left edge — grey (idle), cold/blue (break), moss/green (paid done), alert/red (unpaid done). Unpaid done rail pulses (`pulse-alert`).
- **Timer**: elapsed time since `statusSince` displayed top-right in each card.
- **Hover overlay**: on hover, card content blurs (`blur-[2px]`, `opacity-20`) and action buttons appear centered as an absolute overlay. No vertical height expansion.
  - Idle actions: **Edit · Rest · Finish · Remove**
  - Break actions: **Edit · Return · Finish · Remove**
  - Done actions: **Edit · [✓ Paid + Undo] or [Mark Paid] · Return · Remove**
  - Remove uses a 2-click confirm pattern (shows "Confirm?" for 2.5 s then auto-resets).
- **Action button style**: `font-mono text-[9px] uppercase tracking-[0.22em]` with a `border-[0.5px] border-transparent` that reveals (`hover:border-neon/50` or `hover:border-alert/50`) on hover — hairline box appears on hover without layout shift.

## Done Section — Payment UX
- **If paid**: shows a static `✓ Paid` badge (moss/green border, moss text) alongside a small `Undo` text link that reverts payment status.
- **If unpaid**: shows a `Mark Paid` action button (alert-colored text, transitions to moss on hover).
- This replaces a generic toggle — the paid state is clearly communicated by the badge, and the undo path is explicit.

## Level Chip Colors (Ranking Tiers)
| Level | Tier | Chip style |
|---|---|---|
| Beginner | Bronze | warm amber bg, gold text |
| Low-Intermediate | Silver | cool grey-blue bg, silver text |
| Intermediate | Gold | deep amber bg, bright gold text |
| Upper-Intermediate | Platinum | cyan-steel bg, sky text |
| Advanced | Diamond | deep blue bg, bright blue text |
| Professional | Legend | violet bg, purple text |

Chip backgrounds use semi-transparent colors in the sidebar (boosted opacity ~0.60 for gym lighting readability).

## UI/UX Considerations
1. **Hover Overlay**: Card content blurs and action buttons float above. Keeps cards compact — no layout shift on hover.
2. **Status Rail**: 2px left-edge strip conveys status at a glance.
3. **Payment Pulse**: Unpaid Done players receive a red left-rail pulse (`pulse-alert`).
4. **Drop Zones**: Sections accept player drops. Drop target highlighted with a neon-soft background tint.
5. **Section Counters**: Each collapsible header displays the live player count for that section.
6. **Empty States**: Sections show a descriptive placeholder when no players are present.
7. **Sticky Collapse**: Collapsed section headers remain pinned at the top of the scroll container as thin strips, preserving navigation access without taking space.

## Edge Cases
- Duplicate players: prevented by name + level + gender identity key; silently returns `false` from `addPlayer`.
- Empty state: each section shows a contextual placeholder.
- Deletion: two-click confirm inside the hover overlay (auto-resets after 2.5 s).
- Idle ↔ Break transition: `statusSince` is preserved so accumulated wait time carries through rest periods.

## Acceptance Criteria
- Players in Idle re-sort automatically when a match finishes or a player is added.
- Dragging any player (idle, break, or done) to a court/queue slot updates their status and timer immediately.
- Payment toggle in Done section persists across refreshes (Zustand + localStorage).
- All three sections can be independently collapsed; headers stay sticky at the top.
- Filter input narrows the visible roster in real time across all sections.
- Edit dialog allows updating name, gender, level, and win/loss counts without page refresh.
- Wait timer is not reset when a player moves between Idle and Break.

## Constraints
- A player cannot exist in more than one section or court/queue simultaneously.
- Timers update every second via a single `setInterval` in `PlayerSidebar` — a `tick` timestamp is passed as a prop to each section and card. No per-card intervals.
- Level chips and gender icons use shorthand (BEG, L-INT, INT, U-INT, ADV, PRO; ♂/♀) for compact display.
- The Add Player dialog title is "Add player" and its submit button reads "Add".
