# Minimalist UX Color Theory

Reference material for the minimalist-color skill. Read this when you need to explain *why* a rule exists, not just what it is.

---

## The 60-30-10 Rule

A balanced interface relies on a clear distribution of color to establish hierarchy.

- **60% Dominant (The Base):** Primarily used for backgrounds and large structural elements. In minimalism, this is usually a neutral tone (off-whites, soft grays, or stones).
- **30% Secondary (The Support):** Used for structural contrast — sidebars, cards, and secondary navigation elements.
- **10% Accent (The Action):** Reserved for primary CTAs, active states, and critical notifications.

---

## Elevated Neutrals

Avoid pure black (#000000) and pure white (#FFFFFF) — they cause eye strain and look "unpolished."

- **Organic Tones:** Use "Elevated Neutrals" like oatmeal, slate, or warm sands. These create a more premium, approachable feel.
- **Adaptive Grays:** In Dark Mode, use deep charcoals (e.g., #121212) instead of true black to prevent the "halation" effect (text blurring against excessive contrast).
- **Tonal Layering:** Create depth by using different shades of the same base neutral rather than adding new colors.

---

## "Micro-Hits" and Visual Anchors

In a minimalist environment, color is a tool for communication, not decoration.

- **Visual Anchors:** Use high-saturation "micro-hits" (electric blue, vivid coral, chartreuse) for interactive elements. Against a neutral base, these colors act as immediate visual magnets.
- **Status-Driven Logic:** Dedicate specific colors to functional meanings. In a grayscale-heavy UI, these indicators become instantly recognizable.

---

## WCAG 2.1 Accessibility Standards

- **4.5:1** for standard body text
- **3:1** for large headings (18pt+ or 14pt bold) and UI components
- **Redundancy principle:** Never rely on color alone to convey meaning. Pair with icons, font-weight changes, or underlines.

---

## Depth Without New Hues

To prevent flatness without adding new colors:

- **Glassmorphism:** Subtle transparency and background blur to create a sense of verticality.
- **Soft Shadowing:** Use a slightly darker or more saturated version of the background color for shadows — not black.
- **Opacity shifts:** `rgba(0,0,0,0.04)` on a warm neutral creates a card lift without introducing a new token.
