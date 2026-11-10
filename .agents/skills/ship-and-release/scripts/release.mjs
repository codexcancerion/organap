#!/usr/bin/env node
// OrGanap Ship & Release pipeline.
//
// Runs the exact shipping and release workflow for OrGanap:
//   1. Guard against an uncommitted working tree (warn-and-confirm).
//   2. Run quality gates: typecheck, lint, test, build.
//   3. Bump package.json (patch / minor / major or --dry-run).
//   4. Aggregate Conventional Commits since the last release into
//      CHANGELOG.md (Keep-A-Changelog layout) and mirror to
//      docs/changelog.md.
//   5. Stage all changes and create the "chore: release version X.Y.Z" commit.
//   6. Migrate remote Supabase (supabase db push).
//   7. Push git commits and tags to remote (git push).
//
// Pass --preview to instantly preview bump & changelog without executing gates.
// Pass --fast / --quick to bypass unit tests if already verified.
// Pass --changed-only to run Vitest only on changed files.
// Pass --dry-run to preview without executing destructive steps.
// Pass --skip-test to bypass Vitest unit test suite.
// Pass --skip-build to bypass Next.js production build.
// Pass --skip-db to bypass Supabase remote migration.
// Pass --skip-push to bypass git push.
// Pass --skip-git to bypass git commit and push.

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);
const c = (color, msg) => log(colors[color], msg);

function runCommand(command, description) {
  c("cyan", `→ ${description}…`);
  try {
    execSync(command, { stdio: "inherit" });
    c("green", `✓ ${description} succeeded\n`);
  } catch (error) {
    c("red", `✗ ${description} failed.`);
    process.exit(1);
  }
}

function sh(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function confirmOrAbort(question) {
  const answer = process.env.PRE_PUSH_FORCE === "1" ? "y" : (process.argv.includes("--yes") ? "y" : null);
  if (answer === "y") return;

  // Interactive fallback — read from /dev/tty when available, otherwise bail.
  try {
    const tty = execSync("powershell -NoProfile -Command \"$host.UI.RawUI.FlushInputBuffer; [Console]::In.ReadLine()\"", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    if (tty.trim().toLowerCase().startsWith("y")) return;
  } catch {
    /* non-interactive shell */
  }

  c("yellow", `⚠️  ${question}`);
  c("red", "Aborting. Re-run with --yes or PRE_PUSH_FORCE=1 to override.");
  process.exit(2);
}

// ─────────────────────────────────────────────────────────────────────
// Argument parsing
// ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const previewOnly = args.includes("--preview");
const dryRun = args.includes("--dry-run") || previewOnly;
const isMinor = args.includes("--minor");
const isMajor = args.includes("--major");
const skipGit = args.includes("--skip-git");
const skipPush = args.includes("--skip-push") || skipGit;
const skipDb = args.includes("--skip-db");
const skipTest = args.includes("--skip-test") || args.includes("--fast") || args.includes("--quick");
const skipBuild = args.includes("--skip-build");
const changedOnly = args.includes("--changed-only");
const bumpType = isMajor ? "major" : isMinor ? "minor" : "patch";

c("magenta", "======================================");
c("magenta", "   VOXSELS SHIP & RELEASE PIPELINE    ");
c("magenta", "======================================");
if (previewOnly) {
  c("yellow", "📋 PREVIEW MODE — skipping quality gates, no files written, no remote calls.\n");
} else if (dryRun) {
  c("yellow", "⚠️  DRY-RUN — no files will be written, no remote calls.\n");
}

// ─────────────────────────────────────────────────────────────────────
// 1. Workspace cleanliness check
// ─────────────────────────────────────────────────────────────────────
const status = sh("git status --porcelain");
if (!previewOnly && status && !process.argv.includes("--allow-dirty")) {
  c("yellow", "⚠️  Working tree has uncommitted changes:");
  console.log(status);
  confirmOrAbort("Continue anyway? (y/N)");
}

// ─────────────────────────────────────────────────────────────────────
// 2. Quality gates (Typecheck, Lint, Tests, Build)
// ─────────────────────────────────────────────────────────────────────
if (previewOnly) {
  c("yellow", "• Skipping quality gates in preview mode (--preview passed)\n");
} else {
  runCommand("npm run typecheck", "TypeScript type-check");
  runCommand("npm run lint", "ESLint");

  if (skipTest) {
    c("yellow", "• Skipping unit tests (--skip-test / --fast passed)\n");
  } else if (changedOnly) {
    runCommand("npx vitest run --changed", "Unit tests for changed files (vitest --changed)");
  } else {
    runCommand("npm run test", "Unit test suite (vitest)");
  }

  if (skipBuild) {
    c("yellow", "• Skipping Next.js build (--skip-build passed)\n");
  } else {
    runCommand("npm run build", "Next.js production build");
  }
}

// ─────────────────────────────────────────────────────────────────────
// 3. Version bump
// ─────────────────────────────────────────────────────────────────────
const cwd = process.cwd();
const packageJsonPath = resolve(cwd, "package.json");
if (!existsSync(packageJsonPath)) {
  c("red", `✗ package.json not found at ${packageJsonPath}`);
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const currentVersion = packageJson.version;
c("blue", `• Current version: ${currentVersion}`);

const parts = currentVersion.split(".").map(Number);
if (parts.length !== 3 || parts.some(Number.isNaN)) {
  c("red", `✗ Invalid semver in package.json: ${currentVersion}`);
  process.exit(1);
}

if (bumpType === "major") {
  parts[0] += 1;
  parts[1] = 0;
  parts[2] = 0;
} else if (bumpType === "minor") {
  parts[1] += 1;
  parts[2] = 0;
} else {
  parts[2] += 1;
}
const nextVersion = parts.join(".");
c("green", `• Target version (${bumpType}): ${nextVersion}\n`);

// ─────────────────────────────────────────────────────────────────────
// 4. Conventional-Commit scraping since last release
// ─────────────────────────────────────────────────────────────────────
c("cyan", "→ Fetching commit history since last release…");
let lastReleaseHash = sh('git log --grep="chore: release version" -n 1 --format="%H"');
if (!lastReleaseHash) {
  lastReleaseHash = sh("git rev-list --max-parents=0 HEAD");
}

let commitLines = [];
if (lastReleaseHash) {
  const range = `${lastReleaseHash}..HEAD`;
  const gitLog = sh(`git log ${range} --pretty=format:"%s"`);
  if (gitLog) commitLines = gitLog.split("\n").map((s) => s.trim()).filter(Boolean);
}
c("blue", `• Found ${commitLines.length} commits since last release.`);

// Map Voxsels commit scopes (see AGENTS.md → "Commit messages") to
// Keep-A-Changelog buckets.
const buckets = {
  "Added": [],
  "Changed": [],
  "Deprecated": [],
  "Removed": [],
  "Fixed": [],
  "Security": [],
  "Chore": [],
};

for (const line of commitLines) {
  if (line.startsWith("chore: release version")) continue;
  const m = line.match(/^([a-z]+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
  if (!m) {
    buckets.Changed.push(line);
    continue;
  }
  const [, type, scope, subject] = m;
  const entry = scope ? `**${scope}**: ${subject}` : subject;

  switch (type) {
    case "feat":
      buckets.Added.push(entry);
      break;
    case "fix":
      buckets.Fixed.push(entry);
      break;
    case "perf":
    case "refactor":
      buckets.Changed.push(entry);
      break;
    case "docs":
      buckets.Changed.push(`docs — ${entry}`);
      break;
    case "build":
    case "ci":
    case "style":
    case "test":
      buckets.Chore.push(entry);
      break;
    case "chore":
      buckets.Chore.push(entry);
      break;
    default:
      buckets.Changed.push(entry);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 5. Persist package.json + CHANGELOG.md (+ docs/changelog.md mirror)
// ─────────────────────────────────────────────────────────────────────
if (!dryRun) {
  packageJson.version = nextVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
  c("green", `✓ package.json → ${nextVersion}`);
} else {
  c("yellow", `[dry-run] would set package.json to ${nextVersion}`);
}

const today = new Date().toISOString().split("T")[0];
let section = `## [${nextVersion}] - ${today}\n\n`;
let hasContent = false;

const pushSection = (title, items) => {
  if (items.length === 0) return;
  section += `### ${title}\n\n`;
  for (const item of items) section += `- ${item}\n`;
  section += "\n";
  hasContent = true;
};

pushSection("Added", buckets.Added);
pushSection("Changed", buckets.Changed);
pushSection("Deprecated", buckets.Deprecated);
pushSection("Removed", buckets.Removed);
pushSection("Fixed", buckets.Fixed);
pushSection("Security", buckets.Security);
pushSection("Chore", buckets.Chore);

if (!hasContent) {
  section += `### Changed\n\n- Code optimization and general maintenance\n\n`;
}

const changelogPath = resolve(cwd, "CHANGELOG.md");
const existing = existsSync(changelogPath) ? readFileSync(changelogPath, "utf8") : "# Changelog\n\nAll notable changes to Voxsels are documented in this file.\n\n";

// Insert above the first existing `## [` heading; otherwise append.
const insertIndex = existing.indexOf("## [");
const updated =
  insertIndex !== -1
    ? existing.slice(0, insertIndex) + section + existing.slice(insertIndex)
    : existing.trimEnd() + "\n\n" + section;

if (!dryRun) {
  writeFileSync(changelogPath, updated, "utf8");
  c("green", "✓ CHANGELOG.md updated");

  // Mirror under docs/
  const docsChangelogPath = resolve(cwd, "docs", "changelog.md");
  const frontmatter =
    "---\n" +
    `title: Changelog\n` +
    `description: Voxsels release history mirrored from CHANGELOG.md.\n` +
    "---\n\n";
  const mirrored = frontmatter + updated.replace(/^# Changelog/m, "# Changelog 📋");
  writeFileSync(docsChangelogPath, mirrored, "utf8");
  c("green", "✓ docs/changelog.md updated");
} else {
  c("yellow", `[dry-run] would append the following to CHANGELOG.md:\n\n${section}`);
}

// ─────────────────────────────────────────────────────────────────────
// 6. Release commit
// ─────────────────────────────────────────────────────────────────────
if (!dryRun && !skipGit) {
  try {
    execSync("git add -A", { stdio: "inherit" });
    execSync(`git commit -m "chore: release version ${nextVersion}"`, { stdio: "inherit" });
    c("green", `✓ Release commit created: chore: release version ${nextVersion}\n`);
  } catch (error) {
    c("yellow", `⚠️  Git commit failed or nothing to commit. Continuing.\n`);
  }
} else if (dryRun) {
  c("yellow", "[dry-run] would run: git add -A");
  c("yellow", `[dry-run] would run: git commit -m "chore: release version ${nextVersion}"\n`);
}

// ─────────────────────────────────────────────────────────────────────
// 7. Migrate to Remote Supabase
// ─────────────────────────────────────────────────────────────────────
const projectRefPath = resolve(cwd, "supabase", ".temp", "project-ref");
const isSupabaseLinked = existsSync(projectRefPath);

if (!skipDb) {
  if (!isSupabaseLinked) {
    c("yellow", "• No remote Supabase project linked (run 'supabase link' to link). Skipping remote DB push.\n");
  } else if (!dryRun) {
    try {
      execSync("npx supabase db push", { stdio: "inherit" });
      c("green", "✓ Migrate remote Supabase database succeeded\n");
    } catch (dbErr) {
      c("yellow", `⚠️  npx supabase db push exited with a network or connection notice. Ensure migrations are verified via Supabase MCP or Dashboard.\n`);
    }
  } else {
    c("yellow", "[dry-run] would run: npx supabase db push\n");
  }
} else {
  c("yellow", "• Skipping Supabase remote migration (--skip-db passed)\n");
}

// ─────────────────────────────────────────────────────────────────────
// 8. Git Push
// ─────────────────────────────────────────────────────────────────────
const currentBranch = sh("git branch --show-current") || "main";
if (!skipPush && !dryRun) {
  runCommand(`git push origin ${currentBranch}`, `Git push to origin/${currentBranch}`);
} else if (dryRun) {
  c("yellow", `[dry-run] would run: git push origin ${currentBranch}\n`);
} else {
  c("yellow", `• Skipping git push (--skip-push passed)\n`);
}

c("green", "\n======================================");
c("green", "✓ Voxsels ship & release complete      ");
c("green", "======================================");
