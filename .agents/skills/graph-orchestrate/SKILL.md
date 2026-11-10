---
name: graph-orchestrate
description: >-
  Autonomous Multi-Agent Graph Runtime customized for the Voxsels repository. Orchestrates complex feature implementations, Voxel kinds, session workflows, and refactors with multi-agent plan enrichment, mandatory enforce-rules compliance auditing before testing, and Next.js 16/HeroUI v3/Supabase quality gates. Use when: complex feature, multi-agent orchestration, repository refactor, new voxel kind, session overhaul, multi-step implementation with rule compliance.
argument-hint: "Task description or objective for the graph runtime"
---

# Graph Orchestrate — Voxsels Multi-Agent Graph Runtime

**Graph Orchestrate** is an autonomous multi-agent graph runtime engineered specifically for the **Voxsels** codebase. It orchestrates complex software development tasks (new Voxel types, session extensions, presenter modes, realtime listeners, database migrations) while strictly enforcing Voxsels architecture, Next.js 16 App Router standards, HeroUI v3 design patterns, feature hermeticity, and automated quality gates.

---

## Core Optimization Goals

* **Voxsels Architectural Integrity**:
  * **App Router**: `src/app/**/page.tsx` strictly composes Server Components, wraps layout shells, and exports metadata. No state hooks, no direct Supabase/fetch calls.
  * **Feature Hermeticity**: Product verticals in `src/features/<feature>/` (`voxsels/`, `sessions/`, `lobby/`, `auth/`) are completely hermetic. Zero cross-feature imports.
  * **HeroUI v3 Standards**: Only `@heroui/react` and `@heroui/styles`. No v2 patterns (no `framer-motion`, no `@heroui/system`, no `@heroui/theme`, no `<HeroUIProvider>`, no `title` props on `<Card>`). Built-in styling over custom Tailwind `bg-*`/`border-*` overrides.
  * **Notifications**: HeroUI Toast (`toast.*`) for all user feedback. No bulky static alert banners inside cards.
  * **Data & Services**: Supabase queries isolated in `src/features/<feature>/services/`. No direct DB calls from presentation layers.
* **Multi-Agent Plan Enrichment**: Prior to code modification, the draft plan is reviewed and enriched by specialized subagents (Architecture, HeroUI v3 & Styling, and Feasibility & Testability).
* **Mandatory `enforce-rules` Gate**: Prior to or during the testing phase, the working tree is audited against all repository rules. Violations block test progression and must be resolved first.
* **Quality Gates & Controlled Iterations**: Full validation via `npm run typecheck`, `npm run lint`, and `npm run test` (Vitest), with a maximum of 3 autonomous fix loops before graceful escalation.

---

## Orchestration Graph Lifecycle

```text
  UNDERSTAND (Node 0: Codebase & Task Analysis)
         ↓
    PLAN (Node 1: Planner Subagent Drafts Plan)
         ↓
  MULTI-AGENT PLAN AUDIT & ENRICHMENT (Node 2: Parallel Plan Review)
     ├── Node 2A: Voxsels Architecture & Hermeticity Auditor
     ├── Node 2B: HeroUI v3 & Styling Auditor
     └── Node 2C: Feasibility & Testability Validator
         ↓ [Explicit Barrier Join: Wait for all auditors]
  SYNTHESIZE & CONSOLIDATE (Node 2D: Update implementation_plan.md)
         ↓
  PLAN APPROVED? (User Sign-Off Gate)
     ├── NO  → Revise Plan
     └── YES → IMPLEMENT (Node 3: Scope-Isolated, Feature-Hermetic Execution)
                     ↓ [Explicit Barrier Join: Wait for ALL implementers]
  ═══════════════════════════════════════════════════════════════════════
   MANDATORY RULE COMPLIANCE GATE (Node 3.5: invoke enforce-rules)
   - Runs npm run rules:check -- --diff
   - Spawns compliance auditor subagent against AGENTS.md & READMEs
   - Verifies HeroUI v3, App Router, Hermeticity, Toast policy
  ═══════════════════════════════════════════════════════════════════════
     ├── FAIL / CHANGES_REQUIRED → TARGETED FIX (Node 6)
     └── PASS (APPROVED)
             ↓
           TEST (Node 4: Full Validation Suite)
             - npm run typecheck (tsc --noEmit)
             - npm run lint (eslint --fix)
             - npm run test (vitest run)
             ↓
           AUDIT (Node 5: Final Quality Gate & Diff Auditor)
             ↓
     ┌───────┴───────┐
   PASS             FAIL
     │               │
 COMPLETE      TARGETED FIX (Node 6)
(Node 7: Finish)     ↓
                   RULES GATE (Node 3.5) → TEST (Node 4) → AUDIT (Node 5)
                     ↓
                ESCALATE (If iterations > 3)
```

The main orchestrator retains final decision-making authority and controls transitions between nodes.

---

## Node Execution Breakdown

### Node 0 — Codebase & Task Analysis
* Inspect existing workspace, affected feature verticals (`src/features/voxsels/`, `src/features/sessions/`, etc.), route pages (`src/app/`), and database schema (`supabase/migrations/` and `src/types/database.ts`).
* Identify required component hierarchy:
  * Route: Server Component page (`src/app/<route>/page.tsx`).
  * Feature components: `"use client"` presentation and interactive forms in `src/features/<feature>/components/<kind>_<role>.tsx`.
  * Services: Supabase queries and mutations in `src/features/<feature>/services/<kind>_services.ts`.
  * Types: Single-feature types in `src/features/<feature>/types.ts` or global types in `src/types/`.
* Check relevant skills: skim `.agents/skills/heroui-react/` or `.agents/skills/enforce-rules/`.
* **Rule**: Do not modify code files during Node 0.

---

### Node 1 — Planner Subagent (Draft Plan)
* Create `planner_subagent` via `invoke_subagent` (`TypeName: "self"` or `define_subagent` with `enable_write_tools: true`).
* Generates the draft `implementation_plan.md` artifact covering:
  1. **Objective & Deliverables**: Clear feature scope and user expectations.
  2. **Folder & File Placement**: Explicit mapping conforming to `AGENTS.md` and `docs/technical_specifications.md`.
  3. **App Router & Server Component Boundary**: Verifies `page.tsx` only composes and client state lives in feature components.
  4. **HeroUI v3 Components & Slots**: Explicit list of HeroUI primitives to use (Buttons, Cards, Modals, Drawers, Tabs) and token-based styling.
  5. **Notification Strategy**: Explicit usage of HeroUI Toast (`toast.success()`, `toast.danger()`).
  6. **Data Access & Schema**: Specific services to create/update and any migrations needed.
  7. **Automated Testing Plan**: Vitest unit/integration tests to create or run.
  8. **Scope Boundaries**: Explicit list of files to modify, create, or leave untouched.
* **Rule**: Planner must NOT modify codebase files.

---

### Node 2 — Multi-Agent Plan Audit & Enrichment

The orchestrator launches three specialized subagents in parallel to review and improve the draft plan:

#### Node 2A — Voxsels Architecture & Hermeticity Auditor (`auditor_architecture`)
* **Role**: `"Voxsels Architecture & Hermeticity Specialist"`
* **Tool Mode**: Read-only (`TypeName: "research"` or `enable_write_tools: false`).
* **Auditing Checklist**:
  * **App Router Purity**: Ensures zero client hooks (`useState`, `useEffect`) or direct Supabase queries in `src/app/**/page.tsx`.
  * **Feature Hermeticity**: Verifies no imports cross feature vertical boundaries (`src/features/<a>` to `src/features/<b>`).
  * **Promotion Rule**: Ensures code shared across ≥ 2 features is placed in `src/components/`, `src/hooks/`, `src/types/`, or `src/utils/`.
  * **Thin Handlers**: Verifies Route Handlers (`route.ts`) delegate immediately to typed feature services.

#### Node 2B — HeroUI v3 & Styling Auditor (`auditor_heroui`)
* **Role**: `"HeroUI v3 & Styling Specialist"`
* **Tool Mode**: Read-only (`TypeName: "research"`).
* **Auditing Checklist**:
  * **HeroUI v3 Only**: Confirms absence of `framer-motion`, `@heroui/system`, `@heroui/theme`, `<HeroUIProvider>`, and `title` props on `<Card>`.
  * **Styling Policy**: Ensures no custom Tailwind background (`bg-*`) or border (`border-*`) overrides replace pre-styled HeroUI components.
  * **Toast Notifications**: Ensures HeroUI Toast is used for feedback instead of static inline alert boxes.
  * **CSS Restrictions**: Zero raw CSS files other than `src/styles/globals.css`.

#### Node 2C — Feasibility & Testability Validator (`validator_feasibility`)
* **Role**: `"Voxsels Technical Feasibility & Test Validator"`
* **Tool Mode**: Read-only (`TypeName: "research"`).
* **Auditing Checklist**:
  * **Supabase Client Usage**: Verifies correct use of SSR client utilities (`@supabase/ssr` via `src/utils/supabase/`).
  * **Database Safety**: Ensures no destructive database resets without backups.
  * **Test Coverage**: Confirms that Vitest unit tests (`src/**/__tests__/*.test.tsx`) are included for new components and services.
  * **TypeScript Types**: Verifies `strict: true` compliance, `type` aliases over `interface`, and correct database types.

#### Node 2D — Synthesize Plan & User Sign-Off Gate
* The main orchestrator waits for all 3 auditors to report back (barrier join).
* Synthesizes findings into the final `implementation_plan.md`.
* Obtains user sign-off before proceeding to implementation.

---

### Node 3 — Scope-Isolated Implementation & Barrier Join
* Invoke specialized implementers (e.g. `Implementer-Services`, `Implementer-Components`, `Implementer-Tests`) or execute sequentially.
* **Hard Scope Isolation**: Implementers modify ONLY files within their assigned feature vertical.
* **Barrier Join Rule (CRITICAL)**: Wait until **ALL** spawned implementer subagents have finished before advancing.

---

### Node 3.5 — Mandatory Rule & Compliance Gate (`enforce-rules`)
> **CRITICAL GATE**: This step MUST be invoked **before or during the testing phase** to guarantee all changes comply with repository rules before running test suites.

1. **Static Pre-Check**:
   Run the static checker on the changed files:
   ```bash
   node .agents/skills/enforce-rules/scripts/check_rules.mjs --diff
   ```
2. **Subagent Compliance Audit**:
   Spawn the compliance auditor subagent via `invoke_subagent`:
   - **`TypeName`**: `"research"`
   - **`Role`**: `"Repository Rules & Compliance Auditor"`
   - **`Prompt`**: Audit the active `git diff` against root `AGENTS.md`, `.agents/AGENTS.md`, `src/**/README.md`, and `docs/technical_specifications.md`.
3. **Verdict Evaluation**:
   - If the report returns **`CHANGES_REQUIRED`** or **`BLOCKED`**:
     * **HALT test progression**. Do not proceed to Node 4.
     * Route directly to **Node 6 (Targeted Fix)** with the exact drop-in patches from the compliance report.
   - If the report returns **`APPROVED`**:
     * Proceed to **Node 4 (Testing)**.

---

### Node 4 — Testing & Validation Suite
Create `tester_subagent` or run automated quality gates:
1. **Type Safety**:
   ```bash
   npm run typecheck
   ```
2. **Linting & Code Standards**:
   ```bash
   npm run lint
   ```
3. **Automated Unit & Integration Tests**:
   ```bash
   npm run test
   ```
* Captures stdout, stderr, and failure traces.
* Returns `TEST_PASS` or `TEST_FAIL` with evidence.

---

### Node 5 — Final Quality Gate & Diff Auditor
* Evaluate git diff against:
  - Acceptance criteria and original task requirements.
  - Scope boundaries (no unintentional file modifications).
  - Clean test execution and zero typecheck/lint warnings.
* Returns `PASS` or `FAIL`.

---

### Node 6 — Targeted Fix & Iteration Control
* If Node 3.5 (`enforce-rules`), Node 4 (Tests), or Node 5 (Auditor) returns `FAIL`:
  * Increment iteration counter (`iteration += 1`).
  * If `iteration <= 3`:
    * Implement targeted fix.
    * Re-run **Node 3.5 (`enforce-rules`)** to re-verify compliance.
    * Re-run **Node 4 (Tests)**.
    * Re-run **Node 5 (Auditor)**.
  * If `iteration > 3`:
    * Stop autonomous loops and return `ESCALATE_TO_USER` with full status, diff, test output, and rule findings.

---

### Node 7 — Final Completion & Handoff
* All tests pass, rule compliance is verified (`APPROVED`), and quality gates pass.
* Document changes in `walkthrough.md`.
* Declare `COMPLETE`.
* **Note on Shipping**: `graph-orchestrate` completes feature implementation and quality verification. It does **NOT** release or ship the code. When the user is ready to release, they can invoke the dedicated `/ship` command or `npm run ship`.

---

## Operational Directives for the Orchestrator

1. **Main Agent Holds the Baton**: The main agent controls node transitions, evaluates auditor outputs, and enforces barriers.
2. **Rule Enforcement is Mandatory**: Never skip Node 3.5 (`enforce-rules`). Green tests are meaningless if code violates HeroUI v3 standards, breaks App Router composition, or leaks across feature boundaries.
3. **Disjoint Scope Isolation**: Implementers must never edit files outside their designated assignment.
4. **Controlled Iteration Limit**: Strictly respect the 3-iteration ceiling to prevent runaway loops.
5. **Do Not Over-Orchestrate**: For trivial single-line fixes, apply direct edits without spawning the full multi-agent graph.
