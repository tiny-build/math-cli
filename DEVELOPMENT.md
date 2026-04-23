# Development Guide

Internal reference for maintainers of this monorepo.

---

## Prerequisites

- **Node** ≥ 22, CI-pinned to **24** (see `.node-version`)
- **pnpm** ≥ 10 — install via `npm i -g pnpm` or `corepack enable && corepack prepare pnpm@latest --activate`

---

## Local Setup

```bash
# Clone
git clone <repo-url>
cd math-cli

# Install all workspace deps
pnpm install

# Build all packages
pnpm build

# Run the CLI
node packages/cli/dist/src/index.js
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
