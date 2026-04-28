# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About
Setto is a professional badminton match-making dashboard for tracking wins, players, and match states. It utilizes Spec-Driven Development (SDD) to manage player rotations and court assignments.
## SDD Workflow (Critical Source of Truth)
Before writing any code, Claude must read the corresponding specification in the /specs directory.

* specs/player-sidebar.md: 15% width, player management, Idle/Break/Done sections.
* specs/queue.md: 25% width, pending matches, player displacement logic.
* specs/courts.md: Main area, match resolution, win/loss updates.
* specs/number-cards.md: Top-bar operational metrics and "Big Ass Numbers."

## Commands

npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16.2.3 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 + shadcn/ui |
| Styling | Tailwind CSS v4 (@tailwindcss/postcss) |
| State/Storage | Zustand + persist middleware (LocalStorage) |
| DnD Engine | @dnd-kit |
| Icons | Lucide React (`lucide-react`) — SVG, tree-shakeable. Gender: `Mars`/`Venus` with `fill="currentColor" strokeWidth={0}`. UI icons: `strokeWidth={2.5}` at small sizes. |
| Fonts | Instrument Sans (Display) + Geist Sans (UI/Body) |
| Offline Support | Serwist (PWA / Service Workers) |

## Stack Considerations
   1. Resiliency:
      - Use **Zustand + Persist** for data resiliency across refreshes.
      - Implement **Serwist** (or `next-pwa`) to cache all static assets (fonts, icons, JS) via a Service Worker. 
      - A `manifest.json` must be present to allow users to "Install" the app on their home screen, ensuring the UI loads even without an internet connection.
   2. Typography: Use Instrument Sans for a modern, "Google Sans-like" display feel. Use Geist Sans for standard UI elements.
   3. Information Density: Prioritize "Compact" UI. Use small, solid fonts and shorthand for player levels (Beg, Int, Adv, Pro) to maximize data visibility in the 15% sidebar.
   4. A `manifest.json` must be present to allow users to "Install" the app on their home screen, ensuring the UI loads even without an internet connection.

## Offline Considerations
Next Steps for Offline Implementation:
1. Install Serwist: This is the modern successor to Workbox for Next.js 16/React 19.
2. Create public/manifest.json: This tells the browser the app can be installed.
3. Configure next.config.mjs: To inject the service worker logic during build.

## Project Structure
```
src/
  app/              # App Router (Default Server Components)
  components/       # Shared UI (shadcn, player cards, court slots)
  store/            # Zustand state definitions & persistence logic
  specs/            # Markdown specifications (Source of Truth)
  lib/              # Utils (sorting logic, win-rate calculations)
```

Path alias: @/* → src/*
## Architecture Rules

* Shell Layout: Use CSS Grid for the top-level application structure (Sidebar 15% | Main Content 85%).
* Internal Layout: Use Flexbox for arranging items within cards and sections (e.g., player card details).
* Client Components: Use "use client" only for interactive features (Sidebar, Queue, Courts) to support Drag-and-Drop and real-time timers.
* Data Integrity: When dragging players to occupied slots, the displaced player must be moved back to the "Idle" section of the Sidebar.

## Coding Conventions

* Co-locate components with the route that owns them unless they are shared.
* Avoid any types; use explicit TypeScript interfaces for Player and Match objects.
* Keep client component surface area small; lift state up to the Zustand store.

## Important: Next.js 16 Notice

This project uses Next.js 16. APIs and conventions may differ from training data (v13/v14). Consult the bundled docs at node_modules/next/dist/docs/ before implementing routing or server actions.

