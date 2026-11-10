# `src/styles/` — Global Stylesheet

This folder contains `globals.css`, the **single** stylesheet in the entire repository.

## Policy

1. **Tailwind First**: Express UI styles with Tailwind CSS v4 utility classes or colocated `tailwind-variants` (`tv`) recipes.
2. **HeroUI v3**: Pre-styled compound components. Do not override them with ad-hoc raw CSS selectors.
3. **No extra CSS files**: CSS Modules, component CSS, and CSS-in-JS are prohibited.
