# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

**Setto** is a Next.js app for setting badminton matches — tracking wins, players, and match state.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
```

No test runner or linter is configured yet.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16.2.3 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Fonts | Geist Sans + Instrument Sans + Geist Mono (via `next/font/google`) |
| Component Library | shadcn |
| Hosting | Vercel |

## Stack Considerations
1. Storage - it does not need a database, however I want it to be resilient from accidental refresh once I host it in a vercel.
2. Fonts - Use something modern. The display direction should feel like Google Sans; in code, implement that with Instrument Sans instead of Fraunces because Google Sans is not available through `next/font/google`.


## Project structure

```
src/
  app/
    layout.tsx      # Root layout — Geist sans, Instrument Sans display, Geist Mono
    page.tsx        # Home page (Server Component)
    globals.css     # Tailwind base import + global styles
    favicon.ico
```

Path alias: `@/*` → `src/*`

## Architecture rules

- All routes and layouts live under `src/app/` using the App Router file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, etc.).
- Pages and layouts are **Server Components by default**. Add `"use client"` only when you need browser APIs, React state, or effects.
- Tailwind v4 is configured via `postcss.config.mjs` — no `tailwind.config.*` file is needed.
- TypeScript is in strict mode; avoid `any`, use explicit types at module boundaries.
- Use the `@/` path alias for all internal imports — never use relative `../../` paths across feature boundaries.

## Coding conventions

- Co-locate components with the route that owns them unless they are shared across multiple routes (then place them in `src/components/`).
- Prefer Server Components and server actions over client-side data fetching where possible.
- Keep client component surface area small — lift state up only as far as needed.

## Important: Next.js 16 notice

This project uses **Next.js 16**, which introduced breaking changes from v14/v15. Before writing any routing, data-fetching, or rendering code, consult the bundled docs at `node_modules/next/dist/docs/`. APIs and conventions may differ from training data — do not assume Next.js 13/14 patterns apply.
