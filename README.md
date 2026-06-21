![License](https://img.shields.io/badge/license-MIT-blue.svg) ![CI](https://github.com/mohamedwaleed/repostem/actions/workflows/build-app.yaml/badge.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Status](https://img.shields.io/badge/status-experimental-orange)

# RepoStem – Architectural drift and blast-radius tracking for JS/TS repositories

RepoStem is a structural analysis engine that models a repository as a dependency graph and tracks how its architecture evolves over time.

It surfaces:

- Structural risk (dependency importance, connectivity, churn, cycles)
- Blast radius (transitive dependents)
- Circular dependency clusters
- Architectural drift between snapshots
- Emerging structural hotspots

RepoStem focuses on structural topology and evolution — not lint rules, formatting, or code style.

AI is used only to explain deterministic structural signals.

## Why RepoStem?

Most tools show what your structure looks like today.

RepoStem shows how it is changing.

## What RepoStem is not

- Not a linter
- Not a security scanner
- Not a performance profiler
- Not a code formatter

It is an architectural evolution tracker.

## Quick Start

```bash
# Install
npm install -g @repostem/cli

# Initialize persistence (optional)
repostem init

# Analyze a repository
repostem analyze /path/to/your/repo

# Check risk metrics
repostem risk /path/to/your/repo

# Ask AI about architectural issues (requires keywords + file path)
repostem ask /path/to/your/repo "Is src/utils.js fragile?"
repostem ask /path/to/your/repo "What is the impact of changing src/api/client.js?"
```

## Vision
RepoStem aims to evolve into an AI Project Brain — a persistent cognition layer for repositories that understands architecture, evolution, contributor dynamics, and governance patterns to keep software systems healthy over time.

## Current Features (v0.1.6)

### Core Capabilities
- **Repository Analysis**: Parse JS/TS repositories and build dependency graphs
- **Risk Scoring**: Compute structural risk metrics (centrality, coupling, churn, circular dependencies)
- **Circular Dependency Detection**: Identify problematic dependency cycles
- **Impact Analysis**: Predict impact of file changes across the codebase
- **Snapshot Persistence**: Store and retrieve architectural snapshots over time
- **Architectural Drift Detection**: Compare snapshots to identify structural changes
- **Hotspot Identification**: Find files with high risk and impact that need attention
- **Trend Tracking**: Monitor how hotspots evolve across snapshots
- **Branch Filtering**: Analyze snapshots by branch for multi-branch workflows
- **AI-Powered Insights**: Get natural language explanations of architectural issues (risk, impact, trend, drift, hotspot queries)

### CLI Commands
- `init` - Initialize persistence for snapshot storage (SQLite or PostgreSQL)
- `migrate` - Run database migrations for storage backend
- `analyze` - Full repository analysis with dependency graph (auto-persists if initialized)
- `drift` - Detect architectural drift between snapshots (supports branch filtering)
- `history` - View snapshot history (supports branch filtering)
- `hotspot` - Identify architectural hotspots; use --trend to track evolution over time
- `risk` - Risk metrics and scoring for all files
- `cycles` - Detect and report circular dependencies
- `impact` - Analyze impact of changing specific files
- `ask` - Ask AI questions about your repository architecture (supports risk, impact, trend, drift, and hotspot queries)

### Supported Languages
- JavaScript (.js, .mjs, .cjs)
- TypeScript (.ts, .tsx)

## Roadmap
- Stage 1: Structural intelligence ✅
- Stage 2: Temporal evolution tracking ✅
- Stage 3: Server foundation & configurable parameters
- Stage 4: GitHub integration & automation
- Stage 5: Structural memory & retrieval
- Stage 6: Architectural cognition engine

## AI Configuration

The `ask` command requires OpenAI API for AI-powered explanations:

### Setting up OpenAI API Key

```bash
export OPENAI_API_KEY=your_openai_api_key_here
```

### Supported AI Provider
- **OpenAI GPT**: Currently the only supported AI provider
- Future versions will support multiple AI providers

### Usage
```bash
# Set your OpenAI API key
export OPENAI_API_KEY=sk-...

# Risk questions (requires file path)
repostem ask /path/to/your/repo "What are the risks in src/utils.js?"
repostem ask /path/to/your/repo "Is src/api/client.js fragile?"

# Impact questions (requires file path)
repostem ask /path/to/your/repo "What would be the impact of changing src/core/engine.ts?"

# Trend questions (no file path required)
repostem ask /path/to/your/repo "What is the trend of hotspots?"
repostem ask /path/to/your/repo "Is the architecture getting worse?"

# Drift questions (no file path required)
repostem ask /path/to/your/repo "What has changed in the architecture?"

# Hotspot questions (no file path required)
repostem ask /path/to/your/repo "What are the hotspots?"
```

**Note**: The `ask` command will fail without a valid OpenAI API key. Other commands (analyze, risk, cycles, impact) work without AI.

# Configuration

RepoStem can be configured using a `.repostem.json` or `repostem.config.json` file in your repository root.

## Persistence Configuration

Use `repostem init` to enable snapshot persistence:

```bash
# Interactive mode
repostem init

# With flags
repostem init --storage sqlite --db-path .repostem.db
repostem init --storage postgresql --db-path postgresql://user:pass@localhost/db
```

This creates a `.repostem.json` configuration file:

```json
{
  "respectGitignore": true,
  "ignore": [],
  "storage_type": "sqlite",
  "storage_path": ".repostem.db",
  "repo_id": "uuid-v4"
}
```

### Reconfiguration

If you run `repostem init` again on an already initialized repository, you'll see options:
- **Reconfigure storage backend** - Change storage type/path while preserving repo_id
- **Reset persistence** - Delete all snapshots but keep repo record
- **Cancel** - Exit without changes

The `repo_id` is preserved across storage reconfigurations to maintain repository identity.

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
