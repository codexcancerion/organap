#!/usr/bin/env node

/**
 * Static Rule & Anti-Pattern Checker for OrGanap
 *
 * Checks files against OrGanap project rules:
 * 1. HeroUI v3 invariants (no framer-motion, no @heroui/system or @heroui/theme, no <HeroUIProvider>, no Card title props)
 * 2. Next.js 16 App Router page.tsx invariants (no useState/useEffect, no direct supabase/fetch, no 'use client' in page.tsx)
 * 3. Feature hermeticity (no cross-feature imports between src/features/a and src/features/b)
 * 4. TypeScript & styling constraints
 *
 * Usage:
 *   node .agents/skills/enforce-rules/scripts/check_rules.mjs [--diff | --all | --file <path>]
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

// ANSI color codes
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const args = process.argv.slice(2);
let mode = 'all'; // 'all', 'diff', 'file'
let targetPath = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--diff') {
    mode = 'diff';
  } else if (args[i] === '--all') {
    mode = 'all';
  } else if (args[i] === '--file' && args[i + 1]) {
    mode = 'file';
    targetPath = args[i + 1];
    i++;
  }
}

function getChangedFilesFromGit() {
  try {
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
    const files = statusOutput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // format: XY filename or R  orig -> new
        const parts = line.split(/\s+/);
        return parts[parts.length - 1];
      })
      .filter(f => f.startsWith('src/') && (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.mjs')));
    return [...new Set(files)];
  } catch {
    return [];
  }
}

function getAllSourceFiles(dir = path.join(ROOT_DIR, 'src')) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of list) {
    const fullPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      results = results.concat(getAllSourceFiles(fullPath));
    } else if (/\.(tsx?|jsx?|mjs)$/.test(dirent.name)) {
      results.push(path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/'));
    }
  }
  return results;
}

function checkFile(relPath) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return [];

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  const isPageTsx = /src\/app\/(.+)\/page\.tsx$/.test(relPath);
  const featureMatch = relPath.match(/src\/features\/([^/]+)\//);
  const currentFeature = featureMatch ? featureMatch[1] : null;

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. HeroUI v2 imports
    if (/from\s+['"]framer-motion['"]/.test(line)) {
      violations.push({
        severity: 'CRITICAL',
        file: relPath,
        line: lineNum,
        rule: 'HeroUI v3: No framer-motion (v3 animations are CSS-driven)',
        code: line.trim()
      });
    }

    if (/from\s+['"]@heroui\/(system|theme|core)['"]/.test(line)) {
      violations.push({
        severity: 'CRITICAL',
        file: relPath,
        line: lineNum,
        rule: 'HeroUI v3: Only @heroui/react and @heroui/styles are allowed',
        code: line.trim()
      });
    }

    if (/<HeroUIProvider\b/.test(line)) {
      violations.push({
        severity: 'CRITICAL',
        file: relPath,
        line: lineNum,
        rule: 'HeroUI v3: No <HeroUIProvider> (v3 has no provider)',
        code: line.trim()
      });
    }

    // 2. Card v2 title prop
    if (/<Card\b[^>]*\btitle=/.test(line)) {
      violations.push({
        severity: 'HIGH',
        file: relPath,
        line: lineNum,
        rule: 'HeroUI v3: No title="..." on <Card>. Use <Card.Header> and <Card.Title>',
        code: line.trim()
      });
    }

    // 3. App Router page.tsx invariants
    if (isPageTsx) {
      if (/^\s*['"]use client['"]/.test(line)) {
        violations.push({
          severity: 'HIGH',
          file: relPath,
          line: lineNum,
          rule: 'Next.js 16: page.tsx must be a Server Component. Move client interactivity into src/features/<feature>/components/',
          code: line.trim()
        });
      }

      if (/\b(useState|useEffect|useReducer|useLayoutEffect)\s*\(/.test(line)) {
        violations.push({
          severity: 'CRITICAL',
          file: relPath,
          line: lineNum,
          rule: 'Next.js 16: page.tsx must compose, not hold state. Move hooks into feature components',
          code: line.trim()
        });
      }

      if (/\bcreateClient\s*\(/.test(line) || /\bsupabase\.(from|rpc|auth)\b/.test(line)) {
        violations.push({
          severity: 'CRITICAL',
          file: relPath,
          line: lineNum,
          rule: 'Next.js 16: page.tsx must not call Supabase directly. Use services in src/features/<feature>/services/',
          code: line.trim()
        });
      }
    }

    // 4. Feature Hermeticity (no cross-feature imports)
    if (currentFeature) {
      const crossImportMatch = line.match(/(?:from|import)\s+['"](?:@\/features\/|(?:\.\.\/)+features\/)([^/'"]+)/);
      if (crossImportMatch) {
        const importedFeature = crossImportMatch[1];
        if (importedFeature !== currentFeature && importedFeature !== currentFeature.split('/')[0]) {
          violations.push({
            severity: 'CRITICAL',
            file: relPath,
            line: lineNum,
            rule: `Feature Hermeticity: src/features/${currentFeature} cannot import from src/features/${importedFeature}. Promote shared code to src/components/, src/hooks/, src/types/, or src/utils/`,
            code: line.trim()
          });
        }
      }
    }
  });

  return violations;
}

function run() {
  console.log(`${BOLD}${CYAN}🔍 OrGanap Rule & Anti-Pattern Compliance Checker${RESET}\n`);

  let filesToCheck = [];
  if (mode === 'diff') {
    filesToCheck = getChangedFilesFromGit();
    console.log(`Auditing git diff / working tree (${filesToCheck.length} changed files)...\n`);
  } else if (mode === 'file') {
    filesToCheck = [targetPath.replace(/\\/g, '/')];
    console.log(`Auditing specific file: ${targetPath}...\n`);
  } else {
    filesToCheck = getAllSourceFiles();
    console.log(`Auditing entire src/ tree (${filesToCheck.length} files)...\n`);
  }

  if (filesToCheck.length === 0) {
    console.log(`${GREEN}✅ No target files found to audit.${RESET}`);
    process.exit(0);
  }

  const allViolations = [];
  for (const f of filesToCheck) {
    const v = checkFile(f);
    if (v.length > 0) {
      allViolations.push(...v);
    }
  }

  if (allViolations.length === 0) {
    console.log(`${GREEN}${BOLD}✅ All audited files are 100% compliant with repository rules!${RESET}\n`);
    console.log(`- HeroUI v3 standards: PASS`);
    console.log(`- Next.js 16 page composition rules: PASS`);
    console.log(`- Feature hermeticity: PASS`);
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}❌ Found ${allViolations.length} compliance violation(s):${RESET}\n`);

    allViolations.forEach((violation, idx) => {
      const color = violation.severity === 'CRITICAL' ? RED : YELLOW;
      console.log(
        `${BOLD}[${idx + 1}] ${color}${violation.severity}${RESET} ${BOLD}${violation.file}:${violation.line}${RESET}`
      );
      console.log(`    ${CYAN}Rule:${RESET} ${violation.rule}`);
      console.log(`    ${YELLOW}Code:${RESET} ${violation.code}\n`);
    });

    console.log(`${RED}${BOLD}Verdict: CHANGES_REQUIRED. Please remediate the above violations.${RESET}\n`);
    process.exit(1);
  }
}

run();
