---
name: enforce-rules
description: "Spawn a specialized compliance subagent that dynamically discovers and reads repository rules (AGENTS.md, .agents/AGENTS.md, src/**/README.md, docs) to audit a plan, diff, or file set, producing an Executive Compliance & Implementation Report for the main agent to execute. Use when: enforce rules, rule compliance, audit rules, check guidelines, rule check, verify constraints, compliance audit."
argument-hint: "Optional target to audit (e.g., 'plan', 'git diff', specific file/dir, or leave blank to auto-detect)"
---

# Enforce Rules — Dynamic Repository Compliance & Auditor Skill for Voxsels

The **`enforce-rules`** skill spawns an isolated, specialized subagent that dynamically discovers and ingests all project rule files (`AGENTS.md`, `.agents/AGENTS.md`, `src/**/README.md`, `docs/technical_specifications.md`, etc.), audits the target (a plan, git diff, or code snippet), and outputs a structured **Executive Compliance & Implementation Report** for the main agent to directly implement.

---

## Why Dynamic Rule Discovery?

Rather than hardcoding static rules into the prompt or skill, this workflow **dynamically discovers and reads rules at runtime**. If a developer updates `AGENTS.md`, adds new styling constraints, adjusts documentation requirements, or modifies folder layout rules, the auditor immediately and accurately reflects the latest standards without skill maintenance.

---

## Trigger Scenarios

- **Pre-Implementation**: Audit an `implementation_plan.md` or architectural proposal before writing code.
- **Post-Implementation**: Audit a `git diff` or changed files before running tests, staging, releasing, or committing.
- **On-Demand / Code Review**: Audit a specific folder, component, route, or service for compliance with project standards.
- User commands: `"enforce rules"`, `"audit against agents.md"`, `"check rule compliance"`, `"audit diff"`, `"verify constraints"`.

---

## Step-by-Step Procedure

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. MAIN AGENT: Identify Target Scope                        │
│    (Draft plan, git diff, modified files, or directory)     │
│    Optionally run: npm run rules:check                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. MAIN AGENT: Spawn Specialized Rule Auditor Subagent      │
│    (invoke_subagent with dynamic rule discovery prompt)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SUBAGENT: Dynamic Discovery & Comprehensive Audit        │
│    - Finds and reads all active rule/governance files       │
│    - Inspects target files/diffs for concrete violations    │
│    - Prepares drop-in replacements and remediation steps    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SUBAGENT: Returns Executive Compliance Report            │
│    (Status, Violations Matrix, Exact Fixes, Commands)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. MAIN AGENT: Review & Direct Implementation               │
│    - Applies exact code replacements                        │
│    - Executes required verification commands                │
└──────────────────────────────┘
```

---

### Step 1 — Determine Target Scope & Run Pre-Audit Script

The main agent identifies what is being audited based on the invocation argument:

1. **Plan Audit**: The contents of `implementation_plan.md` or the user's task specification.
2. **Diff / Working Tree Audit**: The active `git diff` (staged and unstaged changes) or files modified during the current session.
3. **Specific File / Directory Audit**: A specified path (e.g. `src/features/`, `src/app/`, `src/components/`).

The main agent can run the local static validator script for an instant baseline pass:

```bash
# Check working tree git diff
node .agents/skills/enforce-rules/scripts/check_rules.mjs --diff

# Or check all files in src/
node .agents/skills/enforce-rules/scripts/check_rules.mjs --all
```

---

### Step 2 — Spawn the Specialized Compliance Subagent

The main agent calls `invoke_subagent` with the following configuration:

- **`TypeName`**: `"research"` (or `"self"` if write tools are needed)
- **`Role`**: `"Repository Rules & Compliance Auditor"`
- **`Prompt`**: Pass the structured dynamic prompt below.

#### Subagent Invocation Prompt Template:

```text
You are the Repository Rules & Compliance Auditor for the Voxsels project. Your sole mission is to dynamically discover, read, and enforce all project rules and produce a comprehensive, structured "Executive Compliance & Implementation Report" for the main agent.

AUDIT TARGET:
{TARGET_DESCRIPTION_OR_DIFF_OR_PLAN}

YOUR PROCEDURE:
1. DYNAMIC RULE DISCOVERY:
   Locate and read all repository rule and governance sources present in this workspace:
   - Root rule files: AGENTS.md, .agents/AGENTS.md, README.md
   - Directory READMEs: src/app/README.md, src/features/README.md, src/components/README.md, src/styles/README.md, src/types/README.md
   - Architecture & specs: docs/technical_specifications.md, docs/rationale.md
   - Active skill guidelines: .agents/skills/*/SKILL.md

2. STATIC & SEMANTIC AUDIT:
   Compare the audit target against EVERY discovered rule, checking specifically for:
   - HeroUI v3 Compliance:
     * NO HeroUI v2 habits: NO framer-motion, NO @heroui/system, NO @heroui/theme, NO <HeroUIProvider>, NO title="…" prop on <Card> (must use compound components <Card.Header>, <Card.Title>).
     * Rely on HeroUI v3 design system: DO NOT add custom Tailwind background colors (bg-*), border colors/widths (border-*), or padding overrides that replace the default look of pre-styled components (Card, ProgressBar, Button, Tabs, etc.). Tailwind is for layout structure only.
   - Next.js 16 App Router Invariants:
     * src/app/**/page.tsx must ONLY compose Server Components, wrap layouts, and export metadata/viewport.
     * NO useState, useEffect, direct fetch(), direct Supabase calls, or business logic inside page.tsx files.
     * Thin Route Handlers (route.ts) that delegate directly to src/features/<feature>/services/.
   - Feature Hermeticity & Folder Layout:
     * No cross-feature imports: src/features/<a>/ must NEVER import from src/features/<b>/.
     * Shared code belongs in src/components/, src/hooks/, src/types/, or src/utils/ (≥ 2 callers required for promotion).
     * Co-locate single-feature types in src/features/<feature>/types.ts.
     * Component naming: <kind>_<role>.tsx (e.g. word_cloud_card.tsx, word_cloud_drawer.tsx).
   - Feedback & Notification Policy:
     * Mandatory HeroUI Toast: use toast.success(), toast.danger(), toast.warning(), toast.info(), or toast() for all mutations and feedback.
     * NO heavy, static inline alert boxes inside cards or drawer modals when a transient toast is appropriate.
   - Database Safety & Remote Migrations:
     * NO destructive database resets (supabase db reset) without data backup first.
     * Remote Supabase migrations must be forward-only and applied automatically in ship-and-release.
   - TypeScript & Conventions:
     * strict: true. Prefer type over interface.
     * Conventional Commits with folder scopes (e.g. feat(voxsels): ..., fix(sessions): ...).

3. REPORT GENERATION:
   Produce an Executive Compliance & Implementation Report using the strict schema below. Provide concrete, drop-in replacement code and exact shell commands so the main agent can execute remediations immediately.
```

---

### Step 3 — Subagent Produces the Executive Report

The subagent delivers the report using this standardized markdown structure:

````markdown
# 📋 Executive Compliance & Implementation Report

## Verdict: [ APPROVED | CHANGES_REQUIRED | BLOCKED ]
- **Audit Target**: `[Plan / Git Diff / Specified Path]`
- **Audited Rule Sources**:
  - `AGENTS.md` (Tech stack lock, HeroUI v3 only, folder layout)
  - `.agents/AGENTS.md` (Styling rules, data safety, HeroUI Toast policy)
  - `src/app/README.md` (App Router composition rules)
  - `src/features/README.md` (Hermetic boundaries & service isolation)
  - `docs/technical_specifications.md`

---

## 1. Compliance Matrix

| Rule Source & Section | Severity | Status | Location | Summary of Finding |
|---|---|---|---|---|
| `AGENTS.md` (HeroUI v3) | CRITICAL | ❌ FAIL | `src/features/...` | Disallowed `framer-motion` import or v2 `title` prop on `Card` |
| `.agents/AGENTS.md` (Styling) | HIGH | ❌ FAIL | `src/features/...` | Custom `bg-content1` / `border-divider` overriding pre-styled HeroUI component |
| `src/app/README.md` §1 | CRITICAL | ❌ FAIL | `src/app/.../page.tsx:L12` | Direct Supabase query or `useState` hook found in route page |
| `src/features/README.md` §1 | CRITICAL | ❌ FAIL | `src/features/sessions/...` | Direct import from `src/features/voxsels/...` |
| `.agents/AGENTS.md` (Toast) | MEDIUM | ⚠️ WARN | `src/features/...` | Inline static alert box instead of HeroUI `toast.success()` |

---

## 2. Detailed Findings & Concrete Remediation

### Finding 1: [Violation Title]
- **Rule Citation**: `[File Name & Section Link]`
- **Offending Code / Plan Item**:
  ```tsx
  // Offending snippet
  ```
- **Prescribed Drop-In Replacement**:
  ```tsx
  // Fully compliant replacement code
  ```
- **Rationale**: Dynamic rule from `[Rule Citation]` forbids this pattern.

---

## 3. Direct Implementation Directives for Main Agent

Ordered list of exact actions the main agent must take:
1. **Apply Code Patch**: Replace lines in `path/to/file` with prescribed replacement.
2. **Execute Validation Commands**:
   ```bash
   node .agents/skills/enforce-rules/scripts/check_rules.mjs --diff
   npm run typecheck
   npm run lint
   npm run test
   ```
````

---

### Step 4 — Main Agent Executes Directives

Upon receiving the Executive Report:
1. If **`APPROVED`**: The main agent proceeds immediately to the next task step or completes the turn.
2. If **`CHANGES_REQUIRED`** or **`BLOCKED`**: The main agent implements the exact drop-in replacements and directives outlined in Section 3 of the report, runs the verification commands (`npm run typecheck`, `npm run lint`, `npm run test`), and confirms resolution.

---

## Verification & Self-Check

- [ ] All rule sources were dynamically discovered via filesystem tools (`find_by_name`, `view_file`) rather than hardcoded assumptions.
- [ ] Every finding has an exact citation linking to the source rule file.
- [ ] Drop-in code patches are syntactically valid and fully compliant with project standards.
- [ ] Verification commands pass without errors (`typecheck`, `lint`, `test`).
