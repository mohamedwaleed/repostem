![License](https://img.shields.io/badge/license-MIT-blue.svg) ![CI](https://github.com/mohamedwaleed/repostem/actions/workflows/build-app.yaml/badge.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Status](https://img.shields.io/badge/status-experimental-orange)

# RepoStem - AI-powered architecture and structural risk analysis for repositories

RepoStem is a model that analyzes a repository as a dependency graph, computes architectural risk metrics, and uses AI to explain structural fragility before changes cause damage.

# Vision
RepoStem aims to evolve into an AI Project Brain — a persistent cognition layer for repositories that understands architecture, evolution, contributor dynamics, and governance patterns to keep software systems healthy over time.

# Current Scope (v0.1 – Experimental)

RepoStem is in early development.

Current capabilities:
- JS/TS repository parsing
- File-level dependency graph construction
- Circular dependency detection
- Basic structural risk scoring
- AI explanation of computed metrics

Not yet implemented:
- GitHub App
- Persistent storage
- Architecture drift tracking
- Contributor modeling
- Multi-language support

# Configuration

RepoStem can be configured using a `.repostem.json` or `repostem.config.json` file in your repository root.

## Ignore Patterns

Control which files and directories are excluded from analysis:

```json
{
  "ignore": [
    "legacy/**",
    "scripts/**",
    "**/*.generated.ts"
  ],
  "respectGitignore": true
}
```

### Default Ignore Patterns

RepoStem automatically ignores common directories:
- `node_modules/`, `.git/`, `dist/`, `build/`, `coverage/`
- Test files: `**/*.test.ts`, `**/*.spec.js`
- Build artifacts: `**/*.min.js`, `**/*.bundle.js`
- Framework outputs: `.next/`, `.nuxt/`, `out/`

### `.gitignore` Integration

By default (`respectGitignore: true`), RepoStem respects your `.gitignore` patterns. Set to `false` to analyze gitignored files.

# Roadmap
- Stage 1: Structural intelligence ✅
- Stage 2: Temporal evolution tracking
- Stage 3: PR-level structural cognition
- Stage 4: Governance & contributor modeling
- Stage 5: AI Project Brain