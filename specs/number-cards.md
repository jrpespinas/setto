# Spec: Number Cards

## Summary
Contains operational numbers prioritized by urgency to drive real-time matchmaking, monitor active games, and summarize session logistics.

## Functional Requirements

- **Tier 1: Matchmaking Queue (High Priority / Immediate Action)**
    - *Purpose: Drives the primary action of getting players onto the court.*
    - **Vacant Courts:** Number of currently empty courts.
    - **Available to Play:** Number of players ready to be matched (Combines 'Idle' and 'Waiting', or displays them adjacently).
    - **Priority Player:** Tracks the time and name of the longest idle player to ensure fair rotation.
- **Tier 2: Active Session Management (Medium Priority / Monitoring)**
    - *Purpose: Tracks current utilization and administrative bottlenecks.*
    - **Occupied Courts:** Number of courts currently in use.
    - **Playing:** Number of players currently on court.
    - **Unpaid Fees:** Number of players who have not yet settled their session fee.
- **Tier 3: Session Summary (Low Priority / Informational)**
    - *Purpose: Passive metrics that do not require immediate intervention to keep games moving.*
    - **Total Courts:** Fixed number of courts available for the session.
    - **Settled:** Number of paid players.
    - **Sidelined:** Number of players on Break or Done for the day.
    - **Top Performer:** Tracks the player with the highest win rate (based on level hierarchy) and highest number of games.

## UI/UX Considerations
1. **Visual Grouping (The "Command Center" Layout):** Do not distribute cards equally. Tier 1 (Matchmaking) should be visually distinct (e.g., slightly larger Shadcn Card, thicker border, or front-and-center placement). Tier 3 should be pushed to the periphery or visually minimized.
2. **Action-Driven Semantic Coloring:**
    - *Vacant Courts:* Green (Go) if > 0 and *Available to Play* > 3. Red if 0.
    - *Unpaid:* Always Red if > 0 to grab administrative attention.
    - *Priority Player:* Amber if idle time > 15 mins, Red if > 25 mins (configurable thresholds).
3. **Interactive Drill-down (Action Triggers):** Clicking a Tier 1 card (e.g., "Available to Play") doesn't just filter the sidebar; it should ideally open the matchmaking/pairing interface. Clicking "Unpaid" filters the sidebar to show who owes fees.
4. **Information Density vs. Size:** For critical action numbers, use the Shadcn Card component with a CardTitle for the label and a massive `text-4xl` or `text-5xl` font. Tier 3 metrics can use `text-2xl` or `text-3xl` to establish hierarchy.
5. **Responsive Scaling:** On smaller screens (tablets), prioritize Tier 1 metrics in the primary viewport. Tier 2 and Tier 3 can wrap into a grid or be hidden behind a toggle/swipe.
6. **Layout:** Number Cards sit at the top of the application view but must not obstruct the `<player-sidebar>`.

## Edge Cases
1. **Matchmaking Bottleneck:** If *Vacant Courts* > 0 but *Available to Play* < 4 (not enough for doubles), highlight the *Available* number to indicate a pairing hold-up.
2. **Tie-Breakers (Top Performer):** Two players have the same highest win rate and game count. Show the one with the highest skill level; if still tied, show the earliest to arrive.
3. **Zero States:** How do cards look when data is 0? "Occupied Courts" at 0 should be neutral. "Unpaid" at 0 should be a subdued, positive color (e.g., muted green) or hidden.
4. **The "Infinite" Idle:** If no players are idle, the timer displays `--:--` or "None" rather than an error or 00:00.
5. **Court Over-assignment:** If more matches are logically queued than total courts, the "Vacant" count stays at 0 and does not go negative.

## Acceptance Criteria
- **Real-time Sync:** Number cards must update instantly (no refresh) when a player is dragged between sections, a match completes, or a payment status changes.
- **Dynamic "Top Performer":** The card correctly calculates the top player based on the hierarchy: Win Rate > Games Played > Level.
- **Layout Integrity:** The numbers must stay anchored at the top and never overlap or get pushed down by the `<player-sidebar>`.
- **Timer Accuracy:** The Priority Player timer must increment every second and pull from the player with the earliest `idle_start_time`.
- **Toggleable Visibility:** Provide a small chevron to "collapse" Tier 2 and Tier 3 stats to save vertical space, leaving only Tier 1 visible if the admin needs more room for the Court view.

## Constraints
- **Read-Only:** These cards are for monitoring and filtering; direct editing of values happens in the sidebar or court views.
- **Z-Index:** Must remain on top of the `<court>` and Queue sections but sit flush against the `<player-sidebar>`.
- **Calculation Overhead:** Sorting available players and computing "Priority Player" times must be highly optimized (e.g., via `useMemo` in React) to prevent UI stuttering as the day progresses and logs grow.
- **Color Contrast:** Must meet WCAG AA standards so the numbers are readable against their specific category or urgency colors.