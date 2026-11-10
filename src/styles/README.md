# `src/styles/` — the ONLY CSS file in OrGanap

OrGanap follows a strict **HeroUI-first, Tailwind-layout, raw-CSS-last** styling policy derived from `voxsels`. This folder contains exactly one file: `globals.css`. **Do not add any other CSS files to the repository.**

---

## The UI Styling Triangle & Use Ratios

| Layer | Approximate Ratio | Primary Responsibility | Rules & Invariants |
| :--- | :--- | :--- | :--- |
| **HeroUI v3** | **~60% of UI surface** (85% of controls) | Interactive primitives, form controls, cards, dialogs, chips, avatars, toasts, drawers | **HeroUI-First Policy**: Pre-styled out of the box with accessible states (focus, hover, disabled). Do **NOT** fight or override HeroUI styles with arbitrary CSS/Tailwind hacks. Use built-in props (`variant`, `size`, `slot`), compound sub-components, or `tv` recipes. |
| **Tailwind CSS v4** | **~40% of UI surface** (100% of layout) | Spatial layout, flex/grid systems, responsive constraints, spacing (`gap-*`, `p-*`), container sizing | **Tailwind-First for Layout**: Express layout and structure via Tailwind utility classes directly in markup or colocated `tailwind-variants` (`tv`) recipes. |
| **Raw CSS** | **< 1%** (Exactly 1 file) | Global framework imports and design tokens | **Raw-CSS-Last**: Confined exclusively to `src/styles/globals.css`. 0 CSS modules, 0 per-component CSS files, 0 CSS-in-JS. |

---

## What `globals.css` is for

1. **Framework imports**
   ```css
   @import "tailwindcss";
   @import "@heroui/styles";
   ```
2. **Custom Tailwind v4 `@theme` tokens**
   ```css
   @theme {
     --font-sans: var(--font-sans), system-ui, sans-serif;
     --color-accent: oklch(0.65 0.18 160);
   }
   ```
3. **Global resets / HTML baseline** that Tailwind does not own (rare).

That's it.

---

## What does NOT go here

- ❌ Per-component CSS — use Tailwind utilities or a `tailwind-variants` recipe colocated with the component.
- ❌ Overrides that fight HeroUI — HeroUI components are pre-styled; if you need a different look, switch the prop/variant/slot in the compound API first.
- ❌ Inline `style={…}` on JSX — only allowed for dynamically computed values (e.g. dynamic color picker or positioning).
- ❌ CSS-in-JS libraries (emotion, styled-components, vanilla-extract, etc.).

---

## How to add a new style

1. Is it an interactive component (button, input, modal, toast)? → Use **HeroUI v3** directly.
2. Is the styling value dependent on a single component? → Use Tailwind utility classes or a `tailwind-variants` recipe in that component file.
3. Is the value shared across many components (a brand token, a radius scale, a semantic color)? → Add it as an `@theme` token in `src/styles/globals.css`, then reference it through Tailwind utilities.
