# Spec: Queue

## Summary
A section where pending matches are queued

## Functional Requirements
- Contains 3 badminton-court like cards called Queue card arranged from top to bottom
    - a queue card has two sides, indicating the teams playing
    - a queue card can contain 2 or 4 players implying it's a doubles or singles game waiting
- a queue card can be dragged
    - dragging the queue card to the \<court\> means dragging all the players in the assigned court
    - dragging the queue card to the \<player-sidebar\> means moving all the players to the idle section
- when a player is moved in the queue section, or any queue card, his timer now monitors for the **waiting** status
- a player can be dragged from one queue card to another
- a player can be dragged from one section to another
- a player can be dragged from one team to another team regardless if \<court\> or Queue

## UI/UX Considerations
1. Visual Hierarchy & "Ghosting"
    - "Ghost" Court Aesthetics: Since you mentioned no solid colors, use a dashed or low-opacity border for Queue cards. This visually signals they are "prototypes" of a match and not a live court.
    - Capacity Indicators: Use "empty slot" silhouettes (e.g., a faint gray circle with a plus icon). This makes it obvious where a player can be dropped and whether a card is currently set for Singles or Doubles.
    - Layout: Occupies 25% of the screen
2. The "Displacement" Warning
    - Target Highlighting: When dragging a player over an occupied slot, the occupied player card should shrink or shake slightly, and the slot should glow (e.g., a subtle amber border). This warns the user: "Dropping here will kick this person back to Idle."
    - Undo Toast: If a player is displaced back to the sidebar, show a brief toast notification: "Player [Name] moved back to Idle. [Undo]".
3. Drag-and-Drop Clarity
    - Handle-based Dragging: In a compact list, dragging the entire card by mistake is annoying. Use a small six-dot drag handle icon for the Queue Card itself, but allow the entire Player Card to be the handle for individual player moves.
    - Snap-to-Grid: Use a "snapping" animation. When a player or card is released near a valid drop zone, it should snap into place instantly rather than drifting.
4. Interactive Timer Feedback
    - Color-Coded Urgency: Since the status is "Waiting," the timer text should subtly change color as they wait longer (e.g., from Gray to Yellow to soft Orange) to help the admin prioritize which queue card to move to a court first.
5. Layout Fluidity
    - Auto-Collapse Empty Slots: If a Queue card is moved to a court, the remaining cards should slide up smoothly (CSS transitions) rather than "teleporting."
6. "Ready to Play" State
    - Pulse Animation: Once a Queue card hits exactly 2 or 4 players, give the "Move to Court" drag handle a subtle pulse effect or change its border color to green. This signals to the admin: "This match is valid and ready to go."


## Edge Cases
- Dragging Players: when a player is dragged to a different queue card, he or she, displaces that player. And the displaced player is returned to the idle section
- Status changes: when a player is dragged, his status changes depending on the section he is placed

## Acceptance Criteria
- Drag-to-Court: Dragging a full Queue card (2 or 4 players) to a \<court> successfully moves all players and clears the Queue card.
- Single Player Displacement: Dragging Player A onto a slot occupied by Player B in a Queue card correctly moves Player B to the "Idle" section and places Player A in that slot.
- Status Synchronization: A player's "Timer" status immediately switches to "Waiting" upon entering the Queue and "Active/Playing" upon entering a Court.
- Empty State: Queue cards display a clear placeholder (e.g., "Empty Slot") when they contain fewer than the required players.
- Bulk Clear: Dragging a Queue card to the \<player-sidebar> returns all players on that card to the "Idle" list in one action.


## Constraints
- No Odd Numbers: A Queue card must only represent a Singles (2 players) or Doubles (4 players) match; it cannot be "started" or dragged to a \<court> if it has 1 or 3 players.
- No Duplicates: The same player cannot exist in two different Queue cards or a Court simultaneously.
- Fixed Capacity: The Queue section is strictly limited to 3 cards; new matches cannot be created until one of the 3 slots is cleared or moved to a court.
- Mobile Interaction: Drag-and-drop must be implemented using a library that supports touch-hold to prevent accidental dragging while scrolling on iPad/Mobile.
- Visual Feedback: During a drag, the "Drop Zone" (Team A vs Team B) must be clearly highlighted to show exactly who is being displaced.

