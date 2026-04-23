# Design: Nx pnpm Monorepo — @tiny-build/math-cli

**Date:** 2026-04-23  
**Status:** Approved

---

## Overview

Migrate the existing demo repository into a production-grade Nx monorepo using pnpm workspaces. The monorepo hosts a single CLI package (`packages/cli`) published as `@tiny-build/math-cli` to both npm and jsr. The setup includes full automation: linting, formatting, conventional commits, changeset-based releases, GitHub Actions CI/CD, issue/PR templates, and an internal release guide.

---

## Repository Structure

```
demo-repository/
├── .changeset/
│   └── config.json
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml
│       ├── release.yml
│       └── auto-assign.yml          ← kept from existing repo
├── packages/
│   └── cli/
│       ├── src/
│       │   └── index.ts             ← opentui TUI entrypoint
│       ├── jsr.json
│       ├── package.json             ← name: @tiny-build/math-cli
│       ├── tsconfig.json
│       └── project.json             ← Nx project config
├── biome.json
├── commitlint.config.mjs
├── nx.json
├── package.json                     ← pnpm workspace root (devDeps only)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .husky/
│   ├── commit-msg
│   └── pre-commit
├── .node-version                    ← pins Node 20
├── DEVELOPMENT.md                   ← internal release guide
└── README.md
```

---

## Toolchain

### Package Manager: pnpm 10+
- `pnpm-workspace.yaml` declares `packages: ["packages/*"]`
- All scripts use `pnpm`; `pnpx` replaces `npx` everywhere
- Lockfile committed; CI uses `--frozen-lockfile`

### Task Runner: Nx (latest)
- `@nx/js` plugin with `tsc` executor for the CLI package
- Targets per package: `build`, `lint`, `typecheck`, `dev`
- `nx affected` used in CI to only run targets on changed packages
- Local computation cache enabled; NX Cloud optional (via `NX_CLOUD_ACCESS_TOKEN`)
- `nx.json` sets `defaultBase: "main"`

### Linting & Formatting: Biome
- Single tool replacing ESLint + Prettier
- Root `biome.json` with strict lint rules and opinionated formatting (tabs, double quotes)
- `pnpm biome check --apply` for fix-in-place
- Nx `lint` target runs `biome check` on each package's `src/`
- `lint-staged` runs Biome on staged files in the `pre-commit` hook

### Commit Hygiene: commitlint + Husky
- `@commitlint/config-conventional` enforces Conventional Commits format
- Husky hooks:
  - `pre-commit`: runs `lint-staged` (Biome on staged `.ts` files)
  - `commit-msg`: runs `commitlint`
- Valid commit types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `build`

### TypeScript
- `tsconfig.base.json` at root: `strict: true`, `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`
- Each package extends base config
- CLI outputs to `dist/` as ESM

---

## CLI Package: `packages/cli`

### Identity
- **npm name:** `@tiny-build/math-cli`
- **jsr name:** `@tiny-build/math-cli`
- **Binary:** `math-cli` (registered via `bin` field)
- **License:** MIT

### Implementation
- Uses **opentui** for terminal UI rendering
- `src/index.ts` renders an animated, visually rich terminal interface on launch
- Entry shebang: `#!/usr/bin/env node`
- ESM output, Node 20+ minimum

### `package.json` key fields
```json
{
  "name": "@tiny-build/math-cli",
  "version": "0.1.0",
  "bin": { "math-cli": "./dist/index.js" },
  "type": "module",
  "exports": { ".": "./dist/index.js" },
  "publishConfig": { "access": "public" },
  "engines": { "node": ">=20" }
}
```

### `jsr.json`
```json
{
  "name": "@tiny-build/math-cli",
  "version": "0.1.0",
  "exports": { ".": "./src/index.ts" }
}
```

---

## Release Flow

### Tool: Changesets (`@changesets/cli` + `changesets/action`)

### Developer workflow
1. Implement feature/fix on a branch
2. Run `pnpm changeset` → select package, bump type (patch/minor/major), write description
3. Commit the generated `.changeset/*.md` file alongside code changes
4. Open PR — CI validates lint + build + types

### Automated release on merge to `main`
1. `release.yml` workflow triggers
2. **Changesets Action** runs:
   - If unreleased changesets exist → opens/updates a **"Version Packages"** PR
     - Bumps `package.json` version(s)
     - Updates `CHANGELOG.md`
   - If "Version Packages" PR is merged → proceeds to publish
3. Publish step:
   - `pnpm changeset publish` → publishes to **npm** using `NPM_TOKEN` secret
   - `pnpx jsr publish` → publishes to **jsr** using GitHub OIDC (no token needed)
4. Workflow creates a **GitHub Release** with the changelog entry

### Required secrets
| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | npm automation token (set in repo Settings → Secrets) |
| GitHub OIDC | Automatic for jsr publish from GitHub Actions |
| `NX_CLOUD_ACCESS_TOKEN` | Optional — Nx remote cache |

---

## CI Workflows

### `ci.yml` — Pull Requests & pushes to `main`
```
Trigger: pull_request, push (main)
Steps:
  1. Checkout (fetch-depth: 0 for nx affected)
  2. Setup Node 20, pnpm 10
  3. pnpm install --frozen-lockfile
  4. pnpx nx affected --target=lint --base=origin/main
  5. pnpx nx affected --target=typecheck --base=origin/main
  6. pnpx nx affected --target=build --base=origin/main
```

### `release.yml` — Push to `main` only
```
Trigger: push (main)
Permissions: contents:write, id-token:write (for jsr OIDC)
Steps:
  1. Checkout
  2. Setup Node 20, pnpm 10
  3. pnpm install --frozen-lockfile
  4. pnpx nx run-many --target=build --all
  5. Changesets action → version or publish
  6. On publish: pnpx jsr publish
  7. Create GitHub Release
```

---

## GitHub Hygiene

### Issue Templates
- **`bug_report.md`**: Describe the bug, reproduction steps, expected vs actual behavior, environment (OS, Node version, CLI version)
- **`feature_request.md`**: Problem motivation, proposed solution, alternatives considered

### PR Template
Checklist:
- [ ] Changeset added (`pnpm changeset`)
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes (Biome clean)
- [ ] TypeScript compiles without errors
- [ ] Tests added/updated if applicable
- [ ] Docs updated if behavior changed

### `DEVELOPMENT.md` (Internal Guide)
Covers:
1. Prerequisites (Node 20+, pnpm 10+)
2. Local setup (`pnpm install`, `pnpm build`)
3. Running the CLI locally (`node packages/cli/dist/index.js`)
4. How to add a changeset
5. How the automated release PR flow works
6. How to set up required secrets (`NPM_TOKEN`)
7. Manual release procedure (if automation fails)
8. How to publish a pre-release / canary version

---

## Key Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| `packages/cli` flat structure | No other packages exist; nesting adds no value now |
| Biome over ESLint+Prettier | Single tool, faster, zero config conflicts |
| Changesets over semantic-release | More control, explicit per-PR intent, widely adopted in pnpm monorepos |
| jsr via OIDC | No token management; GitHub Actions OIDC is the recommended jsr publish method |
| `tsc` executor (no bundler) | CLIs don't need bundling; tsc output is simpler to debug and trace |
| ESM output | Node 20+ standard; opentui and modern deps expect ESM |
