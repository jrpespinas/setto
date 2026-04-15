# Spec: Courts

## Summary
A section containing the courts that can be added, edited, and deleted. 

## Functional Requirements
- By default, contains two badminton court-like cards where you can drag players into a court then a side or team.
- Queue cards can ONLY be dragged to a existing courts.
    - Queue cards containing the players displaces any players within the court
- Players can be dragged between the courts, between sides, and between sections. 
- A court can be deleted
    - Queue Drag Behavior: dragging a Queue card to a court replaces the entire court lineup, not just specific slots, to keep the "Bulk Move" logic consistent.
- A court must have a status: vacant or ongoing match
- You can mark the court as finished match
    - once a match is finished, you are asked which team or side won
    - the players are then reassigned automatically in the idle section of the player side-bar
    - A "Draw" option for match results and specified that winners/losers get their W/L counts updated before moving back to Idle.
    -

## UI/UX Considerations
1. Court Aesthetic: A green panel styled to evoke a badminton court. Two team columns (Team A and Team B) flank a centre "vs" divider. Each column contains slots per player (one slot for singles, two for doubles).
2. Empty player slots: A dashed border placeholder reading "Drop Player". A "+ name" button opens an inline typeahead search to assign a player by name.
3. Court Naming: users can tell "Court 1" from "Court 2."
4. Active State: When a match is "Ongoing," the court border pulses or glows slightly to distinguish it from a "Vacant" court.


## Edge Cases
1. Incomplete Match Finish: Trying to finish a match with 1 or 3 players. (Constraint: Button should be disabled).
2. Accidental Court Deletion: Deleting a court while a match is mid-play. (Requirement: Trigger a confirmation modal).
3. Player Displacement Conflict: If a player is dragged to a court slot already occupied, the existing player is bumped to the Idle section.
4. Court Overload: Trying to add more courts than the screen can fit. (Requirement: The Court section should become a scrollable grid).

## Acceptance Criteria
1. Match Conclusion: When "Team A" is selected as the winner, Team A players receive +1 Win, and Team B players receive +1 Loss.
2. Bulk Movement: Dragging a Queue card (4 players) onto an occupied court successfully displaces the old 4 players to the Idle sidebar.
3. State Transition: A player’s timer must switch from "Waiting" to "Playing" the moment they are dropped onto an active court slot.
4, Dynamic Court Management: Clicking "Add Court" generates a new court instance with unique IDs for all drop zones.
5. Slot Validation: A Singles match (1v1) must be draggable to the court without requiring 4 players to be "valid."

## Constraints
1. Validation: A match cannot be "Finished" unless there is an equal number of players on both sides (1v1 or 2v2).
2. Exclusivity: A player cannot be on two courts at the same time.
3. Layout: The Court section must be responsive, shifting from a side-by-side view to a single-column stack on mobile/narrow screens.
4. Undo Safety: Once a match is "Finished" and stats are updated, the action cannot be undone without manually editing player profiles.

