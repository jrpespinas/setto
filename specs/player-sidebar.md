# Spec: Player Sidebar

## Summary
A fixed sidebar (15% width) containing the roster of players for the session. Players are organized into three collapsible sections — Idle, Break, and Done — and can be dragged to courts or queue cards.

## Functional Requirements
- Player must have: name, gender (male/female), level, status, payment status, win/loss count, and a per-status timer.
- Player levels: beginner, low-intermediate, intermediate, upper-intermediate, advanced, professional.
- Player statuses: idle, waiting, playing, break, done.
- Players in the **Idle** section can be dragged to a `<court>` slot or `<queue>` card slot.
- Players in **Break** or **Done** cannot be dragged directly to a court or queue — they must be returned to Idle first.
- The sidebar has three sections: Idle, Break, Done.
  - **Idle Section**: Players sorted by fewest games played, then longest idle time (earliest `statusSince`).
  - **Break Section**: Player timer continues running but is not monitored for matchmaking.
  - **Done Section**: Payment status is visible and togglable via the hover overlay.
- Each section is collapsible via its header button. Collapsed sections show only the header with count.
- Each section independently scrollable.
- A persistent filter input at the top of the sidebar allows filtering players by name.
- Players can be added via the **+ Add** button which opens an Add Player dialog.

## Player Card Layout
- **Name row**: `♂/♀` gender icon (color-coded) · player name (bold) · level chip (ranking color) — all inline, left-aligned.
- **Stats row**: `Xg · Xw/Xl · X%` win rate (always visible when non-null).
- **Status rail**: 2px vertical strip on the left edge — grey (idle), blue (break), green (paid/done), red (unpaid/done).
- **Hover overlay**: on hover, card content blurs and fades; action buttons appear centered as an overlay. No vertical height expansion.
  - Idle actions: Edit · Break · Done · Remove
  - Break actions: Edit · Resume · Remove
  - Done actions: Edit · Paid/Unpaid toggle (color-coded) · Reopen · Remove
  - Remove uses a 2-click confirm pattern (shows "Confirm?" for 2.5 s then auto-resets).

## Level Chip Colors (Ranking Tiers)
| Level | Tier | Chip style |
|---|---|---|
| Beginner | Bronze | warm amber bg, gold text |
| Low-Intermediate | Silver | cool grey-blue bg, silver text |
| Intermediate | Gold | deep amber bg, bright gold text |
| Upper-Intermediate | Platinum | cyan-steel bg, sky text |
| Advanced | Diamond | deep blue bg, bright blue text |
| Professional | Legend | violet bg, purple text |

## UI/UX Considerations
1. **Hover Overlay**: Card content blurs (`blur-[2px]`, `opacity-20`) and action buttons appear as an absolute overlay. Keeps cards compact — no layout shift on hover.
2. **Status Rail**: 2px left-edge strip conveys status at a glance without colored backgrounds that reduce text contrast.
3. **Payment Pulse**: Unpaid players in the Done section receive a subtle red left-rail pulse (`pulse-alert`) so outstanding fees are impossible to miss.
4. **Drop Zones**: Sections accept player drops (idle section also accepts queue card drops to bulk-clear). Drop target highlighted with a neon-soft background tint.
5. **Section Counters**: Each collapsible header displays the live player count.
6. **Empty States**: Sections show a descriptive empty-state message with contextual drag instructions when no players are present.

## Edge Cases
- Duplicate players: prevented by name + level + gender identity key; silently returns `false` from `addPlayer`.
- Empty state: each section shows a contextual placeholder.
- Deletion: two-click confirm inside the hover overlay (auto-resets after 2.5 s).

## Acceptance Criteria
- Players in Idle re-sort automatically when a match finishes or a player is added.
- Dragging a player to a court/queue slot updates their status and timer immediately.
- Payment toggle in Done section persists across refreshes (Zustand + localStorage).
- All three sections can be independently collapsed; remaining sections expand to fill space.
- Filter input narrows the visible roster in real time across all sections.
- Edit dialog allows updating name, gender, level, and win/loss counts without page refresh.

## Constraints
- A player cannot exist in more than one section or court/queue simultaneously.
- Timers update every second via a single `setInterval` lifted to the section parent — no per-card intervals.
- Level chips and gender icons use shorthand (BEG, L-INT, INT, U-INT, ADV, PRO; ♂/♀) for compact display.
- Break/Done players are non-draggable (drag prevented via `e.preventDefault()` in `onDragStart`).
