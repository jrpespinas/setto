# Spec: Settings — Fees Configuration

> **Scope** — The `/settings` route. A configuration page for session pricing: court rental, shuttlecock cost, and per-player fee calculation. No payment collection — this is a pricing calculator that tells the QM what each player owes.

## 1. Domain Model

### FeesConfig (new — persisted separately from Session)
```ts
type FeesConfig = {
  courtFeePerHour: number;       // e.g. 500 (currency-agnostic)
  shuttlecockPrice: number;      // per tube/shuttle, e.g. 35
  shuttlecocksUsed: number;      // count consumed this session (manual or tracked)
  sessionDurationHours: number;  // auto-derived from session.startedAt, overridable
  splitMethod: "equal" | "per-game"; // how to divide costs among players
};
```

`FeesConfig` lives in a **separate Zustand slice** (`useFeesStore`) with its own `persist` key (`setto-fees`). It survives `resetAll` / "Clear Session" — pricing config is reused across sessions.

### Derived values (computed, not stored)
```ts
totalCourtCost   = courtFeePerHour × sessionDurationHours
totalShuttleCost = shuttlecockPrice × shuttlecocksUsed
totalCost        = totalCourtCost + totalShuttleCost
costPerPlayer    = totalCost / activePlayers  // "equal" split
```

`activePlayers` = players who are not `done` + players marked `done` but `paid === false` (still owe). Alternatively, overridden by the QM directly.

---

## 2. Layout

```
/settings
├─ Nav (shared top bar)
└─ Content (max-w-[640px] centered, padding p-6..p-8)
   ├─ Section: Court Fees
   ├─ Section: Shuttlecock
   ├─ Section: Session Duration
   ├─ Divider
   └─ Section: Fee Summary (read-only calculated output)
```

Single scrollable column, no tabs. Max width 640px centred — this is a simple config form, not a data table.

---

## 3. Sections

### 3.1 Court Fees

| Field              | Input type      | Default | Detail                                    |
|--------------------|-----------------|---------|-------------------------------------------|
| Court fee / hour   | Number input    | 0       | Currency-agnostic. Label: `per hour`.     |
| Number of courts   | Number stepper  | auto    | Auto-filled from `session.courts.length`; overridable. |

Derived display (read-only): `Total court cost: X` = fee × hours × courts.

### 3.2 Shuttlecock

| Field               | Input type     | Default | Detail                                   |
|---------------------|----------------|---------|------------------------------------------|
| Price per shuttlecock | Number input | 0       | Per tube/birdie.                         |
| Shuttlecocks used   | Number stepper | 0       | Manual entry. `+` / `−` buttons, min 0. |

Derived display: `Total shuttlecock cost: X`.

### 3.3 Session Duration

| Field              | Input type   | Default    | Detail                                         |
|--------------------|--------------|------------|------------------------------------------------|
| Session duration   | Number input | auto       | Auto-derived as `(now - session.startedAt) / 3_600_000` rounded to 1 decimal. QM can override. |

"Auto" toggle: when enabled, duration updates live. When disabled, QM enters manually.

### 3.4 Split Method

Radio group:
- **Equal split** — total cost ÷ active player count (everyone pays the same).
- **Per game** — total cost ÷ total games played across all players (players who played more pay more).

### 3.5 Fee Summary (read-only)

```
┌────────────────────────────────────┐
│  Court cost          500           │
│  Shuttlecock cost     70           │
│  ─────────────────────────────     │
│  Total               570           │
│  Active players        8           │
│  Per player           72           │  ← big number, neon accent
└────────────────────────────────────┘
```

Updates live as inputs change. `Per player` is the hero number — displayed large (`big-number digit`), neon-accented when > 0.

---

## 4. Per-Player Breakdown (optional expansion)

Below the summary, a collapsible table showing each player's individual fee when `splitMethod === "per-game"`:

| Player | Games | Share |
|--------|-------|-------|
| Alice  | 4     | 92    |
| Bob    | 2     | 46    |

Only shown when `splitMethod === "per-game"` and at least one match has been recorded.

---

## 5. Persistence

`FeesConfig` persists across sessions in localStorage under `setto-fees`. This means:
- Court fee and shuttlecock price carry over to the next session (QM doesn't re-enter every time).
- `shuttlecocksUsed` and `sessionDurationHours` **reset** when "Clear Session" is called (they are session-specific quantities).
- `splitMethod` persists (QM preference).

---

## 6. No Payment Collection

This page does **not**:
- Collect money
- Send invoices
- Track individual payment status (that remains `player.paid` on the Floor)

It only calculates what each player owes. The QM uses this number verbally or manually.

---

## 7. Acceptance Criteria

1. All three cost inputs update the Summary in real time.
2. Session duration auto-derives from `session.startedAt`; overriding disables auto-update.
3. `costPerPlayer` correctly handles 0 players (shows `—`) and 0 total cost (shows `0`).
4. `FeesConfig` survives page refresh and navigation between routes.
5. `shuttlecocksUsed` resets to `0` when the session is cleared.
6. Per-game breakdown only renders when `splitMethod === "per-game"` and `session.matches.length > 0`.

---

## 8. Constraints

- Currency is **not specified** — inputs are plain numbers. The QM's local currency is implied.
- No decimal rounding UI — raw division result shown; QM rounds in their head.
- No multi-session aggregation in v1.
- No receipt export in v1.

---

## 9. Implementation Pointers

| Concern            | File                                           |
|--------------------|------------------------------------------------|
| Settings page      | `src/app/settings/page.tsx`                    |
| Fees config form   | `src/components/settings/fees-form.tsx`        |
| Fees store slice   | `src/lib/store/fees.ts`                        |
| Types              | `src/lib/types.ts` (`FeesConfig`)              |
