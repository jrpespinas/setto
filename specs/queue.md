# Spec: Match Queue

> **Scope** — A bento card co-located with the courts grid. Three fixed queue slots act as "prototype matches" — staging areas for upcoming lineups that are dragged onto a court when ready.

## 1. Domain Model

### QueueCard
```ts
type QueueCard = {
  id: string;
  size: 2 | 4;             // currently always 4 (doubles)
  slots: (string | null)[]; // length === size
};
```

A session always contains **exactly 3** queue cards (`QUEUE_SLOTS = 3` in the store). The set is created in `seed()` and never grows or shrinks.

## 2. Layout

The queue is a **bento card**, not a sidebar rail. It lives inside the floor area's bento grid alongside the courts:

```
floor area (overflow-y-auto, p-5..p-8)
└─ xl:grid xl:grid-cols-[minmax(0,1fr)_272px] xl:gap-5
   ├─ CourtGrid                ← main column
   └─ QueueRail (272px)        ← side card, hidden < xl
```

Card surface: `bg-ink-100 border-[0.5px] border-hairline-2`. Visually peer to a court card — not attached to the sidebar or metric bar.

The rail is **hidden below `xl`** (`hidden xl:block`). Mobile/tablet users do not see queue staging.

## 3. Queue Card Anatomy

```
┌─────────────────────────┐
│ ⠿ Q·1   [Ready / 2/4]   │  header (drag handle · index · ready chip · Clear)
│ ┌───┐  vs  ┌───┐        │
│ │ A1│      │ B1│        │
│ │ A2│      │ B2│        │
│ └───┘      └───┘        │
└─────────────────────────┘
```

| Element        | Behaviour                                                                                              |
|----------------|--------------------------------------------------------------------------------------------------------|
| Drag handle ⠿  | Visible only when at least one slot is filled. Dragging the card = promoting the lineup.               |
| Index `Q·N`    | 1-based card index, mono digit.                                                                        |
| Ready chip     | `Ready` (neon + `LiveDot`) when all slots filled, else `filled/size`.                                  |
| Clear button   | Visible only when `filled > 0`. Opens a modal `ConfirmDialog` (see §6.2).                              |
| Team A / B     | Two stacked columns, separated by italic `vs`.                                                         |
| Card row       | `rule-bottom last:border-b-0` between rows; `bg-neon-ghost` when ready.                                |

### Team-side cell (filled)
- Surface: `bg-[#f0f2f5]` with `lvl-{level}` background tint baked in.
- Layout: gender glyph (♂/♀, 80% opacity) → name (truncated, no ellipsis) → release × button.
- Cell is `draggable` for direct cell-to-court / cell-to-cell moves.

### Empty cell
- Dashed `border-hairline-3`, accepts drops, hover-lights to `border-hairline-strong`.

## 4. Drag-and-Drop Operations

| Source                 | Target                  | Store action                     | Effect                                                    |
|------------------------|-------------------------|----------------------------------|-----------------------------------------------------------|
| Sidebar player         | Queue slot              | `assignToQueueSlot`              | Player → `waiting`. Displaces existing slot occupant to `idle`. |
| Queue cell             | Queue slot              | `assignToQueueSlot`              | Same as above; releases from previous slot first.         |
| Queue card (whole)     | Court card              | `promoteQueueToCourt`            | All filled players → `playing`; queue card slots cleared. |
| Queue cell × button    | —                       | `releaseQueueSlot`               | Slot cleared; player → `idle`.                            |
| Header **Clear** button| —                       | `dumpQueueToIdle` (after confirm)| All filled players in card → `idle`; slots cleared.       |

DataTransfer payloads:
- `text/player-id` — single-player drag.
- `text/queue-id` — whole-card drag (drop on a court).

A drag originating from a player cell stops propagation so the parent `<li>` does not also start a card drag.

## 5. Status & Timer Semantics

- A player in any queue slot has `status === "waiting"`.
- `statusSince` is **preserved** when a player enters a queue from `idle` — the wait timer carries through. It only resets when the player is promoted to a court (becomes `playing`) or re-enters from `done`.
- Players from any status (`idle`, `break`, `done`) can be dragged into queue slots.
- The metric bar's "Waiting" count includes both `idle` **and** `waiting` players (it is the wait pool, not the queue-only count). See `number-cards.md` §4.

## 6. Confirmations

### 6.1 No confirm needed
- Dragging onto an occupied slot silently displaces the occupant to `idle`. Displacement is the expected workflow, not a destructive op.

### 6.2 Clear queue card — `ConfirmDialog`
- Header **Clear** button opens a modal:
  - Title: `"Clear queue slot?"`
  - Description: `"All players in this queue slot will be returned to idle."`
  - `confirmLabel: "Clear"` · `danger`
- On confirm: `dumpQueueToIdle(card.id)`. (No inline confirmations — see global rule that destructive flows must use modals.)

## 7. Court Player Picker Interaction

When the **+ Add players** picker on a court runs its **"Next N"** auto-fill, it pulls from the wait pool with **`waiting` players prioritised over `idle`**, sorted within each group by fewest `gamesPlayed`, then longest wait. This makes the queue a true priority lane: filling slots manually queues players for the next free court, and "Next N" honours that.

## 8. Level Chips

Same six tiers as the sidebar; cells use the `.lvl-{level}` class which applies an opaque background and accessible text colour suited to the light queue surface.

## 9. Edge Cases

| Case                                                | Behaviour                                                          |
|-----------------------------------------------------|--------------------------------------------------------------------|
| Drop incomplete card (1–3 players) on court         | Allowed; court fills the first N slots, rest remain empty          |
| Drop 4-player card on a singles (size 2) court      | First 2 slots filled; rest discarded                               |
| Player already on a court dragged into queue        | Released from court first, then placed (single-source-of-truth)    |
| Card dragged with the cell × button focused         | Card-drag suppressed via `e.stopPropagation()` on cell drag start  |
| Below `xl` viewport                                 | Queue rail hidden entirely; queue is a desktop-only feature        |

## 10. Acceptance Criteria

1. Queue rail renders exactly **3 cards** at all times; cards never appear/disappear, only their contents change.
2. Promoting a full queue card sets every player to `playing` and resets `statusSince`; the card is left empty in place.
3. Dragging a player into any queue slot sets `status === "waiting"` and **preserves** `statusSince`.
4. The **Clear** button always routes through the modal `ConfirmDialog`. There is no path that clears slots without a confirm step.
5. Court Player Picker's "Next N" lists `waiting` players ahead of `idle` players.
6. Queue rail is hidden below `xl` and visible at `xl`+.
7. All destructive flows surface an Undo toast where applicable.

## 11. Constraints

- Fixed at **3 queue cards**. No add/remove of cards.
- Currently doubles-only (`size === 4`). Singles queue is not supported.
- A player cannot exist in two queue cards, or a queue card and a court, simultaneously. Enforced by `releaseFromQueue` / `releaseFromCourts` before assignment.
- No per-cell timers — wait time is read from the player's `statusSince` against the shared sidebar tick.
- Header label is `"Match Queue"` (statement font, 22px). Subtext: `N / 3 matches ready`.

## 12. Implementation Pointers

| Concern             | File                                                            |
|---------------------|-----------------------------------------------------------------|
| Queue rail shell    | `src/components/queue/queue-rail.tsx`                           |
| Player picker       | `src/components/courts/court-player-picker.tsx`                 |
| Confirm dialog      | `src/components/dialogs/confirm-dialog.tsx`                     |
| Store actions       | `src/lib/store/index.ts` (`assignToQueueSlot`, `releaseQueueSlot`, `promoteQueueToCourt`, `dumpQueueToIdle`) |
