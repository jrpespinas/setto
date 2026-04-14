# specs/overview.md

## What is Setto?
A web app for setting up badminton matches.

## Typography Direction
- Base UI uses a modern grotesk voice, not an editorial serif.
- Headings, key numbers, and emphasized labels should follow a Google Sans-style display direction.
- For implementation, prefer a Google Sans-like sans display font over Fraunces so the interface feels sharper and more operational.

## Core Entities
- Court
- Player
- Payment

## Core Features
1. Court
    - Section covers the majority of the page
    - By default, it has three courts
    - You can create, edit, and delete courts, suppose you have extra courts
    - Court details needed:
        - Court number
        - Players: 2 or 4
        - Status: (Ongoing Match, Vacant)
    - Ask for a confirmation if court is to be deleted, to avoid accidental delete
    - When a court is deleted while there is an ongoing match, consider the game as not Done, therefore there is no increment on the players' match count and win-loss count.
    - The status of the court is determined whether there are 1 or more players on each team. 
    - Players can be added via drag-drop from the sidebar or via name input
2. Players
    - You can view, add, edit, delete players
    - Player details needed:
        - Name
        - Gender: (male, female)
        - Level: (beginner, low-intermediate, intermediate, upper-intermediate, advanced, professional)
        - Status: (playing, done, break)
        - Payment: (Paid or not paid)
    - You can view the list of players in the side of the application like a dedicated section or a sidebar:
        - it is sorted based on the time the player started playing (it determines whether he or she is early or late)
        - the list view is compact but informational, showing the name, the level, number of games played, win loss
        - the player is then automatically dropped to a separate section below if their status is done or break.
            - if the player is done, he or she is marked red or green depending if he or she is paid or not.
            - you can manually toggle if he or she is paid upon confirmation outside the application
        
## Iterations
### Iteration 1
- Players
    - automatically move the players to the active list view unless other wise toggled on a break or done.
    - able to drag players to different sets and courts even if he is assigned to a set or court
- Big Ass Numbers
    - On the top section of the app, I want to see the following number cards:
        - Total Number of Courts
        - Total Number of Players
        - Total Number of Active Players, Break, Done Players
        - Total Number of Paid and Unpaid players
        - Active player with the most vacant time while active (in real time)
    - Ideally, group them based on context, and the focus of the numbers is action-driven, ensure that all players are playing and no time is wasted.
- Typography update
    - Keep the same base sans system from the core UI.
    - Use the Google Sans-style display choice for the top number cards and section headers.
    - Avoid serif display styling in iteration 1 so the dashboard reads like a live operations board.

### Iteration 2
- Minimize the masthead into a header, just retain, session date and time, and app name
- Minimize the Score Cards, retain the categories
- Increase the size of the Courts section
- Make the player cards in the right more compact

### Iteration 3
- change the color of the Sidepick area so that we want to emulate the color of a badminton court, where there is solid green and white lines.

### Iteration 4
- When I drag the player card in the court, it retains a small information about the player such as level and gender
- The player card also disappears from the sidebar when the player is in the court
- arrange the players in the sidebar from top to bottom where in the top is the player with the lowest number of games played

### Iteration 5
- Ensure there are no duplicate players, if a player is not in the sidebar, make sure to check if they are in the courts, or if they are done. A player is identical if they have the same name, level, and gender
- a match cannot be finished until both sides have players
- spell out the level of a player inside the tag. and create another tag for gender, put it beside the name as well if you move the player to the courts

### Iteration 6
- Once the player is dragged to the courts, shorten the tags instead of spelling it out.
- Aadd colors to the tags:
    - blue for male and pink for female, but be consistent with the design aesthetic, don't make it too solid
    - Progressing color of level from light green to solid green, be consistent as well with the overall vibe of the page.

### Iteration 7
- realign the chips, tag, so that it does not overlap from the player component inside the court, do not wrap the chips under the player name when it is dragged inside the court.
- overall app text change, darken the color or increase the font weight a bit to make it more readable.
- make the player editable when the player is in the active sidebar

### Iteration 8