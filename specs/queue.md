# Spec: Queue Rail

## Summary
A fixed 260px vertical rail positioned to the right of the courts grid. Contains exactly 3 queue cards stacked top-to-bottom, each representing a pending match lineup waiting to be assigned to a court.

## Functional Requirements
- The queue rail is always visible at desktop widths (`xl:block`) and hidden on smaller screens.
- There are exactly **3 queue cards** — fixed capacity, no adding or removing cards.
- Each queue card has **4 slots** (doubles format) arranged as Team A (top 2) vs Team B (bottom 2).
- A queue card can be dragged by its drag handle to a `<court>`:
  - All players on the card are moved to the court (`promoteQueueToCourt`).
  - Players already on the court are displaced to Idle.
  - The queue card slots are cleared after promotion.
- A queue card can be dragged to the `<player-sidebar>` idle section to bulk-return all its players to Idle (`dumpQueueToIdle`).
- Individual players can be dragged from the sidebar or another slot into a specific queue slot (`assignToQueueSlot`).
  - If the target slot is occupied, the existing player is displaced to Idle.
- Individual players can be dragged out of a queue slot back to Idle by releasing on the sidebar or via `releaseQueueSlot`.
- When a player enters any queue slot, their status becomes **`waiting`** and their `statusSince` timer is **preserved** — accumulated wait time carries through from Idle into the queue. The timer only resets when the player is promoted to a court (`playing`).
- **All players (Idle, Break, Done) are draggable into queue slots** — there is no restriction based on current status.

## Player Cell Layout (Queue Slot)
- Background: bone card (`bg-[#f0f2f5]`) — same as court player slots, high contrast against the queue card surface.
- Left to right: `♂/♀` gender icon (color-coded, `g-male` / `g-female`) · player name (truncated) · level chip (ranking tier color, solid opaque on light surface).
- Empty slot: dashed border placeholder, drop-target glow when a draggable is hovering.

## Queue Card Layout
- **Drag handle**: 6-dot icon (`⋮⋮`) at the top of the card — grab to drag the entire card to a court.
- **Team A** (top 2 slots) and **Team B** (bottom 2 slots) separated by a thin divider labeled "vs".
- Card border: `border-hairline-2` at rest; highlighted drop-target glow when a player is dragged over it.
- **Ready indicator**: when all 4 slots are filled, the drag handle area shows a neon tint to signal the card is ready to promote.

## Level Chip Colors
Same ranking tier chips as the sidebar player cards:

| Level | Token |
|---|---|
| Beginner | `.lvl-beginner` — amber bg, gold text |
| Low-Intermediate | `.lvl-low-intermediate` — grey-blue bg, silver text |
| Intermediate | `.lvl-intermediate` — deep amber bg, bright gold text |
| Upper-Intermediate | `.lvl-upper-intermediate` — cyan-steel bg, sky text |
| Advanced | `.lvl-advanced` — deep blue bg, bright blue text |
| Professional | `.lvl-professional` — violet bg, purple text |

## UI/UX Considerations
1. **Ghost aesthetic**: Queue cards use a subdued surface (not as prominent as live courts) to signal they are pending, not active.
2. **Drop-zone highlight**: When a player or queue card is dragged over a valid drop zone, the target is highlighted with a neon-soft background tint.
3. **Displacement**: Dropping onto an occupied slot silently displaces the current occupant to Idle (no confirmation required — displacement is expected behavior).
4. **Scrollable rail**: If the queue rail overflows vertically, it scrolls independently of the courts area.
5. **Empty state**: Slots with no player show a dashed placeholder; queue cards with zero players show a contextual empty-state prompt.

## Edge Cases
- Dragging an incomplete queue card (1–3 players) to a court is allowed — the court fills what slots are occupied and leaves others empty.
- A player cannot be in two queue cards or on a court simultaneously; the store enforces exclusivity via `releaseFromQueue` / `releaseFromCourts` before assigning.
- Any player regardless of status (idle, break, done) can be dragged into a queue slot.

## Acceptance Criteria
- Dragging a full queue card (4 players) to a court moves all players and sets their status to `playing`.
- Dragging a queue card to the sidebar returns all its players to Idle and clears the card.
- Dropping a player on an occupied slot correctly displaces the occupant to Idle.
- A player's accumulated wait time is preserved when they enter a queue slot — `statusSince` is not reset until they are promoted to a court.
- All 3 queue cards are always visible in the rail; only their contents change.

## Constraints
- Fixed at **3 queue cards** — no add/remove.
- Queue cards currently support **doubles only** (4-slot format).
- No per-slot timer intervals — timers are driven by the single `setInterval` in the parent section.
- Layout: rail is hidden below `xl` breakpoint (`hidden xl:block`).
- The rail header reads **"Match Queue"**.
