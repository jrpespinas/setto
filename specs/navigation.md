# Spec: Navigation

> **Scope** — Global navigation structure connecting the four routes. Desktop: top nav bar in the masthead. Mobile/tablet: bottom tab bar.

## 1. Route Map

| Route       | Label      | Icon suggestion | Description                        |
|-------------|------------|-----------------|------------------------------------|
| `/`         | Floor      | `LayoutGrid`    | Live court ops (existing)          |
| `/roster`   | Roster     | `Users`         | Player management table            |
| `/records`  | Records    | `BarChart2`     | Leaderboard + Match History        |
| `/settings` | Settings   | `Settings2`     | Fees configuration                 |

## 2. Desktop Nav (top bar, masthead)

The existing masthead gains a nav pill row or inline tab links:

```
[ setto  Session Wed Apr 29 ]  [ Floor · Roster · Records · Settings ]  [ · Live  Clear Session  + Court ]
```

- Active route: `text-bone` + `border-b-[1.5px] border-bone` underline indicator.
- Inactive: `text-bone-4`, hover `text-bone-2`.
- `+ Court` and `Clear Session` buttons are **only visible on the Floor route** — they are session-ops controls, not global.

## 3. Mobile / Tablet Nav (bottom tab bar)

Fixed bottom bar, `h-14`, `bg-ink-100 border-t-[0.5px] border-hairline-2`.

```
┌─────────────────────────────────────────┐
│  ⊞ Floor  👤 Roster  📊 Records  ⚙ Settings │
└─────────────────────────────────────────┘
```

- Active tab: icon + label in `text-bone`, neon underline `border-t-2 border-neon`.
- Inactive: icon only on mobile (< 380px), icon + label on tablet.
- The bottom bar replaces the desktop top nav on `< xl` viewports.

## 4. Live Indicator

A `LiveDot` (pulsing neon dot) appears in the nav adjacent to "Floor" when any court is `ongoing`. This allows the QM to see active matches from other pages without switching tabs.

## 5. Page Transitions

Standard Next.js App Router navigation (no custom transitions in v1). Scroll position resets on route change.

## 6. Acceptance Criteria

1. Active route is visually distinct on both desktop and mobile nav.
2. `+ Court` and `Clear Session` are absent from all routes except `/`.
3. `LiveDot` pulses next to Floor label when `session.courts` has any ongoing match.
4. Bottom tab bar appears below `xl`; top nav appears at `xl`+.
5. All four routes are reachable from any page.

## 7. Implementation Pointers

| Concern          | File                                    |
|------------------|-----------------------------------------|
| Desktop nav      | `src/components/shell/shell.tsx`        |
| Mobile tab bar   | `src/components/shell/bottom-nav.tsx`   |
| Route definitions| `src/app/*/page.tsx`                    |
