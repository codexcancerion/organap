---
name: Playground Generator
description: "Generates boilerplate files (route page, playground demo component, and registry updates) to add a component to the Voxsels interactive playground."
---

# Playground Generator Skill

This skill automates the process of adding a component to the Voxsels interactive components playground. It creates the Next.js routes, creates a skeleton interactive demo component, and updates the registry list configuration.

## When to use it
Use this skill whenever a new reusable layout, navigation, UI primitive, or feature-scoped component is created and needs to be exposed in the interactive `/playground` developer space.

## Usage
Run the Node.js automation script from the root of the project:

```bash
node .agents/skills/playground-generator/scripts/generate_playground.mjs <ComponentName> <ComponentSlug> <ImportPath> [category]
```

### Parameters
- `<ComponentName>`: PascalCase name of the component (e.g. `CustomCard`).
- `<ComponentSlug>`: kebab-case name of the component used for routing (e.g. `custom-card`).
- `<ImportPath>`: Import alias/path to the actual component file (e.g. `@/components/ui/custom_card`).
- `[category]` (optional): Visual bucket. Must be one of `layout`, `navigation`, `ui`, `feature`, `other`. Defaults to `layout`.

### Example
To generate a playground for a new `UserBadge` component:

```bash
node .agents/skills/playground-generator/scripts/generate_playground.mjs UserBadge user-badge "@/components/ui/user-badge" ui
```

## Steps Completed Automatically
1. **Registry Registration**: Appends a metadata block for the component in `src/config/playground.ts`.
2. **Next.js Routing**: Creates the route page folder and `src/app/playground/<ComponentSlug>/page.tsx`.
3. **Skeleton Showcase**: Generates a boilerplate client-side component at `src/components/layout/<ComponentSlug>_demo.tsx` equipped with playground tabs, copy code controls, and basic rendering stubs.

## Next Steps for the Agent
After running the script, you should:
1. Open `src/components/layout/<ComponentSlug>_demo.tsx`.
2. Un-comment the import statement pointing to your real component.
3. Wire up specific props inside the state (e.g. text inputs, toggles, dropdown selections) so developers can interact with the real component properties.
4. Define pre-configured angles inside the `gallery` tab to showcase typical usages.
5. List the types and descriptions inside the `specs` table.
