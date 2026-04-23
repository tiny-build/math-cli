# Nx pnpm Monorepo — @tiny-build/math-cli Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the demo repository into a production-grade Nx monorepo with pnpm, publishing `@tiny-build/math-cli` to npm and jsr via automated Changesets releases.

**Architecture:** Flat monorepo with a single `packages/cli` package using Nx for task orchestration, Biome for linting/formatting, Husky+commitlint for commit hygiene, and a Changesets-driven release flow with GitHub Actions CI/CD.

**Tech Stack:** Nx 22, pnpm 10, TypeScript 5, Ink 7 (React TUI), Biome 2, Changesets, Husky 9, commitlint 20, GitHub Actions

---

## File Map

Files created or modified, grouped by task:

| File | Task | Purpose |
|------|------|---------|
| `package.json` | 1 | Rewrite as pnpm workspace root with all devDeps |
| `pnpm-workspace.yaml` | 1 | Declare `packages/*` workspace |
| `.node-version` | 1 | Pin Node 24 |
| `.gitignore` | 1 | Ignore dist, node_modules, Nx cache |
| `nx.json` | 2 | Nx config with caching and default base |
| `tsconfig.base.json` | 2 | Root TS config (strict, ESM, NodeNext) |
| `biome.json` | 3 | Biome lint + format config |
| `commitlint.config.mjs` | 4 | commitlint conventional config |
| `.husky/pre-commit` | 4 | lint-staged hook |
| `.husky/commit-msg` | 4 | commitlint hook |
| `.changeset/config.json` | 5 | Changesets config |
| `packages/cli/package.json` | 6 | CLI package manifest |
| `packages/cli/tsconfig.json` | 6 | CLI TS config (extends base) |
| `packages/cli/project.json` | 6 | Nx project targets |
| `packages/cli/jsr.json` | 6 | jsr publish config |
| `packages/cli/src/index.ts` | 7 | Ink TUI entrypoint |
| `.github/workflows/ci.yml` | 8 | PR lint/typecheck/build |
| `.github/workflows/release.yml` | 8 | Changesets publish to npm+jsr |
| `.github/ISSUE_TEMPLATE/bug_report.md` | 9 | Bug report template |
| `.github/ISSUE_TEMPLATE/feature_request.md` | 9 | Feature request template |
| `.github/pull_request_template.md` | 9 | PR checklist template |
| `DEVELOPMENT.md` | 10 | Internal release guide |
| `README.md` | 10 | Public-facing readme |

---

## Task 1: Root Workspace Setup (pnpm + Nx scaffold)

**Files:**
- Modify: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.node-version`
- Create: `.gitignore`

- [ ] **Step 1: Back up and rewrite `package.json` as workspace root**

Replace the entire contents of `package.json` with:

```json
{
  "name": "tiny-build-monorepo",
  "private": true,
  "version": "0.0.0",
  "description": "tiny-build monorepo — @tiny-build/math-cli and friends",
  "license": "MIT",
  "engines": {
    "node": ">=22",
    "pnpm": ">=10"
  },
  "packageManager": "pnpm@10.33.0",
  "scripts": {
    "build": "pnpx nx run-many --target=build --all",
    "lint": "pnpx nx run-many --target=lint --all",
    "typecheck": "pnpx nx run-many --target=typecheck --all",
    "format": "pnpx biome format --write .",
    "changeset": "pnpx changeset",
    "version-packages": "pnpx changeset version",
    "release": "pnpm build && pnpx changeset publish",
    "prepare": "husky"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.12",
    "@changesets/cli": "2.31.0",
    "@commitlint/cli": "20.5.0",
    "@commitlint/config-conventional": "20.5.0",
    "@nx/js": "22.6.5",
    "husky": "9.1.7",
    "jsr": "0.14.3",
    "lint-staged": "16.4.0",
    "nx": "22.6.5",
    "typescript": "5.8.3"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 3: Create `.node-version`**

```
24
```

- [ ] **Step 4: Create `.gitignore`**

```
# Dependencies
node_modules/

# Build outputs
dist/
*.tsbuildinfo

# Nx cache
.nx/cache
.nx/workspace-data

# OS
.DS_Store
Thumbs.db

# Editor
.idea/
.vscode/settings.json
*.swp

# Environment
.env
.env.local
```

- [ ] **Step 5: Install dependencies**

```bash
pnpm install
```

Expected: `node_modules` created at root, lockfile updated. No errors.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml .node-version .gitignore pnpm-lock.yaml
git commit -m "chore: init pnpm workspace root"
```

---

## Task 2: Nx and TypeScript Base Config

**Files:**
- Create: `nx.json`
- Create: `tsconfig.base.json`

- [ ] **Step 1: Create `nx.json`**

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/*.spec.ts",
      "!{projectRoot}/tsconfig.spec.json"
    ],
    "sharedGlobals": ["{workspaceRoot}/tsconfig.base.json"]
  },
  "targetDefaults": {
    "build": {
      "cache": true,
      "inputs": ["production", "^production"],
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "cache": true,
      "inputs": ["default", "^default"]
    },
    "lint": {
      "cache": true,
      "inputs": ["default", "{workspaceRoot}/biome.json"]
    }
  },
  "plugins": [
    {
      "plugin": "@nx/js/typescript",
      "options": {
        "typecheck": { "targetName": "typecheck" },
        "build": {
          "targetName": "build",
          "configName": "tsconfig.json"
        }
      }
    }
  ]
}
```

- [ ] **Step 2: Create `tsconfig.base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "rootDir": ".",
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "moduleResolution": "NodeNext",
    "module": "NodeNext",
    "target": "ES2022",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "paths": {}
  },
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

- [ ] **Step 3: Verify Nx is working**

```bash
pnpx nx show projects
```

Expected: empty list (no packages yet) with no errors.

- [ ] **Step 4: Commit**

```bash
git add nx.json tsconfig.base.json
git commit -m "chore: add nx config and tsconfig base"
```

---

## Task 3: Biome Linter and Formatter

**Files:**
- Create: `biome.json`

- [ ] **Step 1: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.12/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": ["dist", "node_modules", ".changeset", "*.md"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "style": {
        "useConst": "error",
        "useTemplate": "error"
      },
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  }
}
```

- [ ] **Step 2: Run Biome to verify config is valid**

```bash
pnpx biome check --config-path biome.json .
```

Expected: exits 0 or reports only formatting issues (no config errors).

- [ ] **Step 3: Commit**

```bash
git add biome.json
git commit -m "chore: add biome linter and formatter config"
```

---

## Task 4: Commit Hygiene (Husky + commitlint + lint-staged)

**Files:**
- Create: `commitlint.config.mjs`
- Create: `.husky/pre-commit`
- Create: `.husky/commit-msg`
- Modify: `package.json` (lint-staged config)

- [ ] **Step 1: Create `commitlint.config.mjs`**

```js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "chore", "docs", "refactor", "test", "ci", "build", "revert"],
    ],
    "subject-case": [2, "always", "lower-case"],
    "header-max-length": [2, "always", 100],
  },
};
```

- [ ] **Step 2: Initialize Husky**

```bash
pnpx husky init
```

Expected: creates `.husky/` directory with a sample `pre-commit` file.

- [ ] **Step 3: Write `.husky/pre-commit`**

Replace `.husky/pre-commit` entirely with:

```sh
pnpx lint-staged
```

- [ ] **Step 4: Write `.husky/commit-msg`**

```sh
pnpx commitlint --edit "$1"
```

- [ ] **Step 5: Add lint-staged config to `package.json`**

Add the following top-level field to `package.json` (after `"devDependencies"`):

```json
"lint-staged": {
  "*.{ts,tsx}": ["biome check --apply --no-errors-on-unmatched"]
}
```

- [ ] **Step 6: Verify commitlint config loads**

```bash
echo "chore: test" | pnpx commitlint
```

Expected: exits 0 (valid commit message).

- [ ] **Step 7: Verify invalid commit is rejected**

```bash
echo "bad commit message" | pnpx commitlint
```

Expected: exits non-zero with error about missing type prefix.

- [ ] **Step 8: Commit**

```bash
git add commitlint.config.mjs .husky/pre-commit .husky/commit-msg package.json
git commit -m "chore: add husky, commitlint, and lint-staged"
```

---

## Task 5: Changesets Configuration

**Files:**
- Create: `.changeset/config.json`

- [ ] **Step 1: Initialize changesets**

```bash
pnpx changeset init
```

Expected: creates `.changeset/config.json` and `.changeset/README.md`.

- [ ] **Step 2: Rewrite `.changeset/config.json`**

Replace the generated config entirely with:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 3: Commit**

```bash
git add .changeset/
git commit -m "chore: init changesets config"
```

---

## Task 6: CLI Package Scaffold

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/project.json`
- Create: `packages/cli/jsr.json`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p packages/cli/src
```

- [ ] **Step 2: Create `packages/cli/package.json`**

```json
{
  "name": "@tiny-build/math-cli",
  "version": "0.1.0",
  "description": "A beautiful animated CLI — by tiny-build",
  "license": "MIT",
  "type": "module",
  "bin": {
    "math-cli": "./dist/index.js"
  },
  "exports": {
    ".": "./dist/index.js"
  },
  "files": ["dist", "README.md"],
  "engines": {
    "node": ">=22"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "dependencies": {
    "@inkjs/ui": "2.0.0",
    "ink": "7.0.1",
    "react": "19.1.0"
  },
  "devDependencies": {
    "@types/react": "19.1.5"
  }
}
```

- [ ] **Step 3: Create `packages/cli/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create `packages/cli/project.json`**

```json
{
  "name": "@tiny-build/math-cli",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/cli/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "packages/cli/dist",
        "main": "packages/cli/src/index.tsx",
        "tsConfig": "packages/cli/tsconfig.json",
        "assets": []
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpx tsc --noEmit",
        "cwd": "packages/cli"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpx biome check src/",
        "cwd": "packages/cli"
      }
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node dist/index.js",
        "cwd": "packages/cli"
      },
      "dependsOn": ["build"]
    }
  }
}
```

- [ ] **Step 5: Create `packages/cli/jsr.json`**

```json
{
  "name": "@tiny-build/math-cli",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.tsx"
  }
}
```

- [ ] **Step 6: Install CLI package dependencies**

```bash
pnpm install
```

Expected: `react`, `ink`, `@inkjs/ui`, `@types/react` installed in `packages/cli/node_modules`.

- [ ] **Step 7: Verify Nx sees the new package**

```bash
pnpx nx show projects
```

Expected: `@tiny-build/math-cli` listed.

- [ ] **Step 8: Commit**

```bash
git add packages/cli/package.json packages/cli/tsconfig.json packages/cli/project.json packages/cli/jsr.json pnpm-lock.yaml
git commit -m "chore: scaffold cli package with nx project config"
```

---

## Task 7: CLI Implementation (Ink TUI)

**Files:**
- Create: `packages/cli/src/index.tsx`

- [ ] **Step 1: Create `packages/cli/src/index.tsx`**

```tsx
#!/usr/bin/env node
import { render, Box, Text, useApp } from "ink";
import { useEffect, useState } from "react";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const GRADIENT = [
	"#FF6B6B",
	"#FF8E53",
	"#FFC300",
	"#2ECC71",
	"#1ABC9C",
	"#3498DB",
	"#9B59B6",
	"#FF6B6B",
];

function Spinner() {
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setFrame((f) => (f + 1) % FRAMES.length);
		}, 80);
		return () => clearInterval(timer);
	}, []);

	return <Text color="cyan">{FRAMES[frame]}</Text>;
}

function AnimatedTitle() {
	const [colorIndex, setColorIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setColorIndex((i) => (i + 1) % GRADIENT.length);
		}, 200);
		return () => clearInterval(timer);
	}, []);

	return (
		<Text bold color={GRADIENT[colorIndex]}>
			✦  math-cli  ✦
		</Text>
	);
}

function Counter() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setCount((c) => c + 1);
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	return (
		<Text>
			<Text color="gray">uptime: </Text>
			<Text color="yellow" bold>
				{count}s
			</Text>
		</Text>
	);
}

function App() {
	const { exit } = useApp();

	useEffect(() => {
		const onKey = (data: Buffer) => {
			if (data.toString() === "q" || data.toString() === "") {
				exit();
			}
		};
		process.stdin.on("data", onKey);
		return () => {
			process.stdin.off("data", onKey);
		};
	}, [exit]);

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="cyan"
			paddingX={3}
			paddingY={1}
			gap={1}
		>
			<Box justifyContent="center">
				<AnimatedTitle />
			</Box>

			<Box gap={2} justifyContent="center">
				<Spinner />
				<Text color="gray">@tiny-build/math-cli</Text>
				<Spinner />
			</Box>

			<Box flexDirection="column" gap={0}>
				<Text>
					<Text color="green">✓ </Text>
					<Text color="white">Ready and running</Text>
				</Text>
				<Text>
					<Text color="blue">ℹ </Text>
					<Text color="white">Version </Text>
					<Text color="cyan">0.1.0</Text>
				</Text>
			</Box>

			<Box borderStyle="single" borderColor="gray" paddingX={2}>
				<Counter />
			</Box>

			<Text color="gray" dimColor>
				Press <Text color="white">q</Text> to exit
			</Text>
		</Box>
	);
}

if (process.stdin.isTTY) {
	process.stdin.setRawMode(true);
}

render(<App />);
```

- [ ] **Step 2: Build the CLI**

```bash
pnpx nx build @tiny-build/math-cli
```

Expected: `packages/cli/dist/index.js` created, no TypeScript errors.

- [ ] **Step 3: Run the CLI to verify it renders**

```bash
node packages/cli/dist/index.js
```

Expected: animated TUI renders in terminal with spinning loaders, animated title, uptime counter. Press `q` to exit.

- [ ] **Step 4: Run typecheck**

```bash
pnpx nx typecheck @tiny-build/math-cli
```

Expected: exits 0 with no errors.

- [ ] **Step 5: Run lint**

```bash
pnpx nx lint @tiny-build/math-cli
```

Expected: exits 0 (Biome clean).

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/index.tsx
git commit -m "feat: add animated ink TUI for math-cli"
```

---

## Task 8: GitHub Actions Workflows

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/release.yml`
- Modify: `.github/workflows/auto-assign.yml` (keep as-is — no changes needed)

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint, Typecheck, Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Set Nx base
        run: echo "NX_BASE=origin/main" >> $GITHUB_ENV

      - name: Lint
        run: pnpx nx affected --target=lint --base=$NX_BASE --head=HEAD

      - name: Typecheck
        run: pnpx nx affected --target=typecheck --base=$NX_BASE --head=HEAD

      - name: Build
        run: pnpx nx affected --target=build --base=$NX_BASE --head=HEAD
```

- [ ] **Step 2: Create `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: write
  pull-requests: write
  id-token: write

jobs:
  release:
    name: Version or Publish
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
          cache: pnpm
          registry-url: https://registry.npmjs.org/

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build all packages
        run: pnpx nx run-many --target=build --all

      - name: Create Release PR or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm release
          title: "chore: version packages"
          commit: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Publish to jsr
        if: steps.changesets.outputs.published == 'true'
        run: pnpx jsr publish
        working-directory: packages/cli
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/release.yml
git commit -m "ci: add ci and release workflows"
```

---

## Task 9: GitHub Hygiene (Issue Templates + PR Template)

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`
- Create: `.github/ISSUE_TEMPLATE/feature_request.md`
- Create: `.github/pull_request_template.md`

- [ ] **Step 1: Create `.github/ISSUE_TEMPLATE/bug_report.md`**

```markdown
---
name: Bug report
about: Something isn't working as expected
title: "fix: "
labels: bug
assignees: ""
---

## Describe the bug

A clear and concise description of what the bug is.

## To reproduce

Steps to reproduce the behavior:
1. Run `math-cli ...`
2. See error

## Expected behavior

What you expected to happen.

## Actual behavior

What actually happened. Include any error output.

## Environment

- OS: [e.g. macOS 15, Ubuntu 22.04]
- Node version: [e.g. 24.0.0] (`node --version`)
- math-cli version: [e.g. 0.1.0] (`math-cli --version`)
- Install method: [npm / jsr / built from source]

## Additional context

Any other context, screenshots, or logs.
```

- [ ] **Step 2: Create `.github/ISSUE_TEMPLATE/feature_request.md`**

```markdown
---
name: Feature request
about: Propose a new feature or improvement
title: "feat: "
labels: enhancement
assignees: ""
---

## Problem / motivation

What problem does this feature solve? Why do you need it?

## Proposed solution

Describe the feature you'd like to see. Be as specific as possible.

## Alternatives considered

What other approaches did you consider and why did you rule them out?

## Additional context

Links, screenshots, prior art, or any other context.
```

- [ ] **Step 3: Create `.github/pull_request_template.md`**

```markdown
## Summary

<!-- What does this PR do? One or two sentences. -->

## Type of change

- [ ] Bug fix (`fix:`)
- [ ] New feature (`feat:`)
- [ ] Refactor (`refactor:`)
- [ ] Documentation (`docs:`)
- [ ] CI / tooling (`ci:` / `chore:`)

## Checklist

- [ ] Changeset added (`pnpm changeset`) — required for any user-facing change
- [ ] `pnpm build` passes locally
- [ ] `pnpm lint` passes (Biome clean)
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Tests added or updated (if applicable)
- [ ] `DEVELOPMENT.md` updated (if the release process or setup changed)

## Related issues

Closes #
```

- [ ] **Step 4: Commit**

```bash
git add .github/ISSUE_TEMPLATE/ .github/pull_request_template.md
git commit -m "docs: add issue templates and PR template"
```

---

## Task 10: DEVELOPMENT.md and README.md

**Files:**
- Create: `DEVELOPMENT.md`
- Modify: `README.md`

- [ ] **Step 1: Create `DEVELOPMENT.md`**

```markdown
# Development Guide

Internal reference for maintainers of this monorepo.

---

## Prerequisites

- **Node** ≥ 22 (pinned in `.node-version`)
- **pnpm** ≥ 10 — install via `npm i -g pnpm` or `corepack enable && corepack prepare pnpm@latest --activate`

---

## Local Setup

```bash
# Clone
git clone <repo-url>
cd demo-repository

# Install all workspace deps
pnpm install

# Build all packages
pnpm build

# Run the CLI
node packages/cli/dist/index.js
# or after publishing / linking:
# math-cli
```

---

## Daily Development

```bash
# Lint changed packages
pnpx nx affected --target=lint --base=main

# Typecheck changed packages
pnpx nx affected --target=typecheck --base=main

# Build changed packages
pnpx nx affected --target=build --base=main

# Format all files
pnpm format

# Run the CLI in dev (rebuilds first)
pnpx nx dev @tiny-build/math-cli
```

---

## Adding a Changeset

Every PR that changes user-facing behavior **must** include a changeset.

```bash
# From repo root
pnpm changeset
```

Follow the prompts:
1. Select the package(s) affected (`@tiny-build/math-cli`)
2. Choose bump type: `patch` (bug fix), `minor` (new feature), `major` (breaking change)
3. Write a short description — this becomes the changelog entry

Commit the generated `.changeset/<random-name>.md` file with your PR.

---

## Release Flow

Releases are **fully automated** via the `release.yml` GitHub Actions workflow.

### How it works

1. You merge a PR with a changeset to `main`
2. The `release.yml` workflow runs the [Changesets Action](https://github.com/changesets/action)
3. The action opens (or updates) a **"Version Packages"** PR that:
   - Bumps `package.json` version(s) based on accumulated changesets
   - Updates `CHANGELOG.md`
4. A maintainer reviews and merges the "Version Packages" PR
5. The workflow runs again — this time it detects no pending changesets and runs `pnpm release`:
   - Publishes to **npm** using `NPM_TOKEN`
   - Publishes to **jsr** using GitHub OIDC (no token required)
6. A GitHub Release is created automatically with the changelog entry

### Required secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | How to get it |
|--------|---------------|
| `NPM_TOKEN` | npm.com → Account → Access Tokens → Generate New Token → **Automation** type |

GitHub OIDC for jsr is automatic — no secret needed. First publish to jsr requires the package to be created at [jsr.io](https://jsr.io) under the `@tiny-build` scope.

### First-time jsr setup

1. Log in at [jsr.io](https://jsr.io) with GitHub
2. Create the `@tiny-build` scope (or request access if it exists)
3. The OIDC publish from GitHub Actions will work automatically after that

---

## Manual Release (if automation fails)

```bash
# Make sure you're on main with a clean working tree
git checkout main && git pull

# Build
pnpm build

# Publish to npm (requires npm login or NPM_TOKEN in env)
NPM_TOKEN=<your-token> pnpm changeset publish

# Publish to jsr (requires jsr login)
pnpx jsr login
cd packages/cli && pnpx jsr publish
```

---

## Pre-release / Canary

To publish a pre-release version (e.g. `0.2.0-beta.1`):

```bash
# Enter pre-release mode
pnpx changeset pre enter beta

# Add changesets, commit, version as normal
pnpm changeset
pnpm version-packages

# Publish
pnpm release

# Exit pre-release mode when ready
pnpx changeset pre exit
```

---

## Commit Convention

This repo uses [Conventional Commits](https://www.conventionalcommits.org/). commitlint enforces this on every commit.

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, dependencies, config |
| `docs` | Documentation only |
| `refactor` | Code change with no behavior change |
| `test` | Adding or fixing tests |
| `ci` | GitHub Actions / CI changes |
| `build` | Build system changes |
| `revert` | Reverting a previous commit |

Format: `type(optional-scope): subject` — e.g. `feat(cli): add --version flag`
```

- [ ] **Step 2: Rewrite `README.md`**

```markdown
# @tiny-build/math-cli

A beautiful, animated terminal UI built with [Ink](https://github.com/vadimdemedes/ink).

## Install

```bash
# npm
npm install -g @tiny-build/math-cli

# pnpm
pnpm add -g @tiny-build/math-cli

# jsr
jsr add @tiny-build/math-cli
```

## Usage

```bash
math-cli
```

Press `q` to exit.

## Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for the full contributor guide, local setup instructions, and release process.

## License

MIT
```

- [ ] **Step 3: Commit**

```bash
git add DEVELOPMENT.md README.md
git commit -m "docs: add development guide and public readme"
```

---

## Task 11: Verification Pass

- [ ] **Step 1: Full build from clean state**

```bash
pnpx nx reset && pnpm build
```

Expected: all targets succeed, `packages/cli/dist/index.js` present.

- [ ] **Step 2: Lint all packages**

```bash
pnpm lint
```

Expected: exits 0.

- [ ] **Step 3: Typecheck all packages**

```bash
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 4: Run the CLI end-to-end**

```bash
node packages/cli/dist/index.js
```

Expected: animated TUI renders, uptime increments, `q` exits cleanly.

- [ ] **Step 5: Verify changeset tooling**

```bash
pnpx changeset status
```

Expected: reports no unreleased changesets (clean state).

- [ ] **Step 6: Verify commitlint on a test message**

```bash
echo "feat(cli): add version flag" | pnpx commitlint
```

Expected: exits 0.

- [ ] **Step 7: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: verification pass fixes"
```

---

## Notes

- `@opentui/core` was evaluated but requires **Bun** (uses `bun-ffi-structs` for its native Zig core). **Ink** is used instead — it is the standard Node.js React TUI library.
- jsr publish uses GitHub OIDC — no `JSR_TOKEN` secret is required. The `@tiny-build` scope must exist at jsr.io before the first automated publish.
- The `release.yml` workflow sets `NODE_AUTH_TOKEN` from `NPM_TOKEN` — this is required by `actions/setup-node` to authenticate the npm registry.
- Nx `affected` in CI uses `fetch-depth: 0` so git history is available to compute the diff base.
