![License](https://img.shields.io/badge/license-MIT-blue.svg) ![CI](https://github.com/mohamedwaleed/repostem/actions/workflows/build-app.yaml/badge.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Status](https://img.shields.io/badge/status-experimental-orange)

# RepoStem - AI-powered architecture and structural risk analysis for repositories

RepoStem is a CLI tool that analyzes repositories as dependency graphs, computes architectural risk metrics, and uses AI to explain structural fragility before changes cause damage.

## Quick Start

```bash
# Install
npm install -g @repostem/cli

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

## Current Features (v0.1.0)

### Core Capabilities
- **Repository Analysis**: Parse JS/TS repositories and build dependency graphs
- **Risk Scoring**: Compute structural risk metrics (centrality, coupling, churn, circular dependencies)
- **Circular Dependency Detection**: Identify problematic dependency cycles
- **Impact Analysis**: Predict impact of file changes across the codebase
- **AI-Powered Insights**: Get natural language explanations of architectural issues

### CLI Commands
- `analyze` - Full repository analysis with dependency graph
- `risk` - Risk metrics and scoring for all files
- `cycles` - Detect and report circular dependencies
- `impact` - Analyze impact of changing specific files
- `ask` - Ask AI questions about your repository architecture

### Supported Languages
- JavaScript (.js, .mjs, .cjs)
- TypeScript (.ts, .tsx)

## Roadmap
- Stage 1: Structural intelligence ✅
- Stage 2: Temporal evolution tracking
- Stage 3: PR-level structural cognition
- Stage 4: Governance & contributor modeling
- Stage 5: AI Project Brain

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

# Use ask command with AI explanations
repostem ask /path/to/your/repo "Is src/utils.js fragile?"
```

**Note**: The `ask` command will fail without a valid OpenAI API key. Other commands (analyze, risk, cycles, impact) work without AI.

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