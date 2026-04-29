# Spec: Courts

> **Scope** — The main content area: court cards, match lifecycle, court CRUD, and the player-assignment dialog. The masthead "+ Court" and "Clear Session" controls live here because they mutate court state.

## 1. Domain Model

### Court
```ts
type Court = {
  id: string;              // uid()
  number: number;          // unique within a session, 1..N
  size: 2 | 4;             // 2 = singles, 4 = doubles
  slots: (string | null)[]; // length === size; null = empty
  matchStartedAt?: number; // ms epoch; set when court becomes ongoing
};
```

### Court status (derived, not stored)
| Status   | Definition                                                |
|----------|-----------------------------------------------------------|
| `vacant` | All slots `null`                                          |
| `partial`| Some slots filled but not both sides have a player        |
| `ongoing`| At least one player on each side (`size/2` halves)        |

`courtStatus(court, playersById)` is the single source of truth — UI must not re-derive it inline.

## 2. Default State

- A fresh session (`seed()`) starts with **zero courts**. The grid renders an empty-state CTA pointing the user at the "+ Court" masthead button.
- `Clear Session` resets to this same zero-court default — never re-seeds courts.

## 3. Court CRUD

### 3.1 Add Court — `AddCourtDialog`
Opened by the masthead **"+ Court"** button.

- **Court number** input: free-typed `<input type="text">`, sanitised to digits via `replace(/\D/g, "")`. Stored as `numberStr` and parsed on submit (`Math.max(1, parseInt(numberStr, 10) || 1)`). Never reset on keystroke.
- **Quantity stepper**: 1–8. Label flips to "Starting number" when `count > 1`; preview text reads `Creates courts N–M`.
- **Format toggle**: Singles (size 2) · Doubles (size 4). Default Doubles.
- **Pre-validation**: build the array of would-be numbers, check against existing `session.courts`. If any conflict, surface a single error (`Courts X, Y already exist.`) and create **none** — batch add is all-or-nothing.
- On open, the starting number defaults to `max(existing court numbers) + 1`, or `1` if no courts exist.
- Toast on success with Undo (restores `session` snapshot).

Store: `addCourt(size, number?) => boolean`. Returns `false` only on duplicate.

### 3.2 Edit Court — `EditCourtDialog`
Opened by the per-court **"Edit"** footer button.

- **Disabled when the court is `ongoing`**. Button shows tooltip `"Finish the match to edit"`.
- Editable fields: court number, format.
- Changing format truncates/extends `slots` array, preserving existing player IDs in the prefix.
- Duplicate-number validation surfaces inline error; no toast on failure.
- Warns inline when `size` changes mid-session: `"Changing format clears slots on this court."`

Store: `updateCourt(id, patch) => boolean`. Returns `false` on duplicate number.

### 3.3 Delete Court — `ConfirmDeleteCourtDialog`
Opened by the per-court **"Delete"** footer button.

- **Modal confirmation** (no inline / double-click patterns). Surfaces `isOngoing` so the dialog can warn about an active match.
- On confirm: court is removed; any players in its slots are released to `idle`.
- Toast with Undo.

### 3.4 Clear Session — `ConfirmDialog`
Masthead **"Clear Session"** button.

- Modal confirm with `danger` variant. Title: `"Clear session?"`.
- Calls `resetAll()` which replaces `session` with `seed()` (zero courts, zero players, empty queue, `matchesCompleted = 0`).
- Toast with Undo.

## 4. Player Assignment

### 4.1 Drag-and-drop
- A player dragged from the sidebar or a queue slot to a court slot calls `assignToCourtSlot(courtId, slotIndex, playerId)`.
- If the target slot is occupied, the displaced player is silently moved to `idle` (no confirmation — displacement is expected).
- Assignment releases the player from any other court or queue slot (`releaseFromCourts` / `releaseFromQueue`).
- Player status becomes `playing`.

### 4.2 Court Player Picker — `CourtPlayerPicker`
Opened by the per-court **"+ Add players"** footer button (only shown when not ongoing).

- Two-column picker (Side A / Side B), capacity = `size / 2` per side.
- **"Next N"** quick-fill: prioritises `waiting` players (in queue) first, then `idle`. Sorted within each group by fewest `gamesPlayed`, then longest wait (`statusSince`).
- Submit button labelled **"Start match"** (not "Confirm"). Calls `bulkAssignToCourt`.

### 4.3 Queue → Court promotion
- Dropping a queue card on a court invokes `promoteQueueToCourt(queueId, courtId)`.
- All filled queue slots are copied into the court (null-padded to `court.size`); displaced court players go to `idle`; queue card is cleared in place.
- Players' status flips from `waiting` → `playing`.

### 4.4 Slot operations
- Per-slot **release** (× icon): `releaseCourtSlot` — player returns to `idle`.
- Per-slot **swap sides** (↔ icon): `swapCourtSlots` — exchanges with the symmetric slot on the opposite side. Does not change `matchStartedAt`.

## 5. Match Lifecycle

### 5.1 Match timer
- `matchStartedAt` is set when a court transitions `vacant|partial → ongoing`.
- Preserved on intra-match swaps and replacements (court stays `ongoing`).
- Cleared (`undefined`) when court returns to vacant or `finishMatch` runs.
- The header displays a live `MM:SS` (`font-mono digit tabular-nums`), replacing the format label:
  - `< 12 min` → `text-bone-3`
  - `≥ 12 min` → `text-warm`
  - `≥ 15 min` → `text-alert`
- Per-court interval is mounted only while `matchStartedAt` is set.

### 5.2 Finish match — `FinishMatchDialog`
The footer **"Finish match"** button is shown **only** when `status === "ongoing"`.

- Modal popup (no inline confirmation). Presents:
  - Side A wins (lists Side A names)
  - Side B wins (lists Side B names)
  - Draw · no record (dashed-border secondary action)
- All three outcomes call `finishMatch(courtId, winner)` with `winner ∈ {"A", "B", "none"}`.
- **No win/loss tracking** exists — `winner` is currently informational and unused by the store. The argument is preserved for future use.
- On finish:
  - All players on the court → `idle`, `statusSince = now()`, `gamesPlayed += 1`.
  - Court slots cleared, `matchStartedAt` unset.
  - `session.matchesCompleted += 1` — increments for **every** finish, including draws.
- Toast with Undo.

## 6. Visual Design

### 6.1 Court surface
- BWF-accurate green `#1a7a40` with a subtle top-highlight gradient.
- 2px white boundary lines on left/right edges via `background-image` strips.
- 2px white `border-x` divider between Side A and Side B, labelled `vs` in italic display font.

### 6.2 Court header
- Eyebrow: `Court` in mono uppercase.
- Court number: `big-number digit` 48px, **zero-padded to 2 digits** (`01`, `02`). This is the only zero-padded numeric in the app.
- Status chip: neon `Ongoing` (with `LiveDot`) or muted `Vacant`.
- Below the chip: match timer (when ongoing) or format label (`Singles` / `Doubles`).

### 6.3 Player slots
- Light surface (`bg-[#f0f2f5]`) for high contrast on green.
- Layout: gender icon (`Mars` / `Venus`, color-coded) → name (truncated) → level chip → swap (↔) → release (×).
- Empty slot: dashed white-translucent border, hover-highlights on drag-over.

### 6.4 Level chip palette (court surface only)
Opaque `rgb()` backgrounds — semi-transparent chips fail contrast on green.

| Level                | Background          | Text       |
|----------------------|---------------------|------------|
| Beginner             | `rgb(160, 88, 34)`  | `#ffd4a0`  |
| Low-Intermediate     | `rgb(90, 100, 118)` | `#e0e8f4`  |
| Intermediate         | `rgb(158, 122, 16)` | `#fff0a0`  |
| Upper-Intermediate   | `rgb(24, 138, 174)` | `#c0f0ff`  |
| Advanced             | `rgb(48, 82, 200)`  | `#c0d4ff`  |
| Professional         | `rgb(118, 38, 178)` | `#f0c0ff`  |

### 6.5 Footer
- Left: Edit · Delete (`xs ghost`).
- Right: `Finish match` (neon, when ongoing) **or** `+ Add players` (solid, otherwise).

## 7. Edge Cases

| Case                                          | Behaviour                                                        |
|-----------------------------------------------|------------------------------------------------------------------|
| Drop on occupied slot                         | Silent displacement to `idle` (no confirm)                       |
| Delete court mid-match                        | Modal confirm; players return to `idle` on confirm               |
| Edit court with ongoing match                 | Edit button disabled; tooltip surfaces reason                    |
| Format change with players present            | Inline warning in dialog; slots truncated/preserved on save      |
| Queue card (4 slots) onto singles court (2)   | First 2 slots filled; rest discarded                             |
| Batch add with one duplicate                  | Whole batch rejected; error surfaces existing conflicts          |
| Court overflow                                | Grid scrolls vertically inside the floor area                    |

## 8. Acceptance Criteria

1. Fresh session loads with **zero courts**; the grid shows an empty-state CTA.
2. `+ Court` creates 1–8 courts in a single batch; all-or-nothing on duplicates.
3. `Edit` is disabled exactly when `courtStatus(court) === "ongoing"`.
4. `Finish match` only renders when `ongoing`. The dialog records winner and increments `matchesCompleted` for **every** finish (including draws).
5. After finishing, all court players are `idle`, `gamesPlayed` is incremented, and `matchStartedAt` is cleared.
6. `Clear Session` and all destructive court actions go through a modal `ConfirmDialog` — no double-click or inline confirmations remain.
7. Court header shows zero-padded number (`01`, `02`); no other numeric in the app is zero-padded.
8. Match timer colour-shifts at 12 min (warm) and 15 min (alert).
9. All destructive flows surface an Undo toast that calls `restoreSession(prev)`.

## 9. Constraints

- A player cannot occupy two courts, or a court and a queue card, simultaneously. Enforced in the store via `releaseFromCourts` / `releaseFromQueue` before assignment.
- Court numbers are unique within a session and **never re-sequenced** on deletion — the next auto-assigned number is `max(existing) + 1`.
- Win/loss is **not** tracked. `gamesPlayed` is incremented but no per-player wins or losses are stored.
- The match timer uses a per-court interval mounted only while `matchStartedAt` is set; metric-bar timers use a single shared 1s tick.
- Court grid lives in the bento-grid area shared with the queue; horizontally constrained by `minmax(0,1fr)`.

## 10. Implementation Pointers

| Concern                | File                                                              |
|------------------------|-------------------------------------------------------------------|
| Court card             | `src/components/courts/court-card.tsx`                            |
| Court grid + empty     | `src/components/courts/court-grid.tsx`                            |
| Player picker          | `src/components/courts/court-player-picker.tsx`                   |
| Add court              | `src/components/dialogs/add-court-dialog.tsx`                     |
| Edit court             | `src/components/dialogs/edit-court-dialog.tsx`                    |
| Delete court           | `src/components/dialogs/confirm-delete-court-dialog.tsx`          |
| Finish match           | `src/components/dialogs/finish-match-dialog.tsx`                  |
| Generic confirm        | `src/components/dialogs/confirm-dialog.tsx`                       |
| Store actions          | `src/lib/store/index.ts` (`addCourt`, `updateCourt`, `removeCourt`, `assignToCourtSlot`, `bulkAssignToCourt`, `swapCourtSlots`, `releaseCourtSlot`, `promoteQueueToCourt`, `finishMatch`, `resetAll`) |
