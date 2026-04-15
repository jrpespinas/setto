# Spec: Player Sidebar

## Summary
A sidebar containing the list of players to manage. 

## Functional Requirements
- Player must have a gender: male or female
- Player must have a level: beginner, intermediate, advanced, or professional
- Player must have a status: idle, break, waiting, playing, or done
- Player must have a name
- Player must have a payment status: paid or unpaid
- Player must have a win-loss count
- Player must have a timer per status.
- Player can be dragged to the \<court\> or \<queue\> from the Sidebar
- The sidebar has three sections: Idle, Break, or Done
    - Idle Section:
        - The players are arranged from top to bottom with fewest number of games on top and the most idle time.
    - Break Section:
        - The players dragged here still have a running idle time, but they are not monitored in the app unless the player is moved to the idle section
    - Done Section:
        - When the player is dragged in the Done section his payment status becomes visible.
        - The payments status can be toggled
    - Each section has a scroll bar function
    - Each section can be adjustable and collapsible
- The player can be edited regardless of the section
- The player can be deleted regardless of the section

## UX Considerations
1. Visual "Status" Indicators (The 15% Rule)
    - Color-Coded Status Bars: Instead of colored backgrounds (which make text hard to read), use a thin vertical status strip on the left edge of each player card (e.g., Gray for Idle, Yellow for Waiting, Blue for Playing).
    - Payment Glow: In the "Done" section, use a subtle red "unpaid" pulse for players who haven't paid yet. This makes it impossible for an admin to miss a payment before the player leaves.
2. Smart "Empty State" Call-to-Actions
    - Contextual Buttons: When a section is empty (e.g., no one is on "Break"), don't just show text. Show a dashed-border box that says "Drag here to start break" or "Add Player." This teaches the user how to use the drag-and-drop system.
3. Progressive Disclosure (Compactness)
    - Hover/Tap for Details: Since the list is compact, show only Name and Timer by default. Reveal Gender, Level, and Win-Loss only when the user hovers over the card or selects it. This keeps the UI "clean" but data-rich when needed.
    - Section Header Counters: Display a badge on each collapsible header (e.g., Idle (12), Break (3)) so the admin knows the player count even when a section is collapsed.
4. Drag-and-Drop "Magnetic" Zones
    - Drop Indicator: When dragging a player, the target section (Idle, Break, or Done) should expand slightly or change its background tint to act as a "landing pad."
    - Multi-Select (Power User): Allow holding Shift or Ctrl to select multiple players and drag them as a group to "Break" or "Done." This is a huge time-saver for finishing a doubles match.
5. Interaction Safety
    - Swipe-to-Action (iPad/Mobile): Since it’s a sidebar, consider adding swipe-left-to-delete or swipe-right-to-edit gestures, similar to iOS mail, to keep the UI free of bulky buttons.
    - Ghosting: When a player is dragged out of the sidebar, leave a low-opacity "ghost" card in their original spot until the drop is confirmed. This prevents the list from jumping/re-sorting while the user is still aiming for a court.
6. Search & Filter Bar
    - Persistent Filter: Add a tiny search icon at the top of the sidebar. In a busy tournament with 50+ players, scrolling through 15% of the screen becomes tedious. A quick name filter is essential.


## Edge Cases
- Duplicate players: prevent creation of duplicate players, show an error toast or alert
- Unsaved changes: ask for confirmation whether to continue or not
- Empty state: Define behavior for when no players are currently in the system

## Acceptance Criteria
- Dynamic Sorting: Players in the Idle Section must automatically re-sort (fewest games at top, then longest idle time) whenever a match ends or a player is added.
- Drag-to-Target: Dragging a player card from the Sidebar to a specific slot in a \<court> or \<queue> successfully updates their status to "Playing" or "Waiting."
- Status Transitions: Moving a player between Sidebar sections (e.g., Idle to Break) must trigger the appropriate timer reset or "monitored" state change.
Payment Toggle: In the Done Section, clicking the payment status must toggle between "Paid" (Green/Success) and "Unpaid" (Red/Destructive) and persist that state.
- Section Management: Users can collapse any of the three sections (Idle, Break, Done) to focus on others, with the remaining sections expanding to fill the 15% sidebar width.
- Inline Editing: Clicking a player card opens a shadcn Dialog or Popover allowing updates to Name, Gender, Level, and Win-Loss count without page refreshes.
- Deletion Confirmation: Deleting a player must trigger a "Confirm Delete" alert to prevent accidental data loss.


## Constraints
- State Integrity: A player cannot exist in more than one sidebar section or court/queue simultaneously.
- Timer Accuracy: Timers must update in real-time (per second) without causing visible lag or excessive re-renders in the 15% sidebar space.
- Visual Information Density: Player cards must be "Compact"—using icons for gender (e.g., ♂/♀) and shorthand for levels (Beg, Int, Adv, Pro) to ensure readability at a small font size.
- Drag Constraint: Players in the Break or Done sections cannot be dragged directly to a \<court>; they must be moved to Idle or Queue first to ensure they are "ready."
- Z-Index Handling: Dragged player items must always appear on top of all other UI elements (sidebar, courts, and queues) to maintain visual clarity during transit.
