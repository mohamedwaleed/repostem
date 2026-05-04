# RepoStem CLI

A powerful command-line interface for structural risk analysis of JavaScript/TypeScript repositories. RepoStem helps you identify fragile code, architectural hotspots, and potential maintenance risks before they become problems.

## 🚀 Features

- **Structural Analysis**: Complete repository-wide dependency graph analysis
- **Risk Assessment**: File-level risk scoring based on centrality, coupling, churn, and circular dependencies
- **Impact Analysis**: Understand the transitive impact of modifying any file
- **Circular Dependency Detection**: Identify and visualize dependency cycles
- **AI-Powered Insights**: Get natural language explanations of structural metrics
- **Multiple Output Formats**: Text, JSON, and table output options

## 📦 Installation

### Global Installation
```bash
npm install -g @repostem/cli
```

### Local Installation
```bash
npm install @repostem/cli
```

### Development Installation
```bash
git clone https://github.com/your-org/repostem.git
cd repostem
pnpm install
pnpm build
```

## 🎯 Quick Start

### Analyze a Repository
```bash
# Analyze current directory
repostem analyze

# Analyze specific repository
repostem analyze -r /path/to/your/repo

# Output as JSON
repostem analyze -r ./my-repo -o json
```

### Check File Risk
```bash
# Check risk for a specific file
repostem risk src/utils/helpers.js

# Check risk in a different repository
repostem risk src/components/Button.tsx -r /path/to/repo
```

### Analyze Impact
```bash
# See what would be affected by changing a file
repostem impact src/core/engine.js

# Impact analysis with JSON output
repostem impact src/api/client.ts -o json
```

### Detect Circular Dependencies
```bash
# Find all circular dependency cycles
repostem cycles

# Cycles in specific repository
repostem cycles -r /path/to/repo
```

### View Snapshot History
```bash
# Show persisted analysis history for the current repository
repostem history

# History for a specific branch
repostem history -b main

# History with JSON output
repostem history -o json
```

### Identify Architectural Hotspots
```bash
# Show current architectural hotspots
repostem hotspot

# Hotspots for a specific repository
repostem hotspot -r /path/to/repo

# Hotspots with JSON output
repostem hotspot -o json
```

### Detect Architectural Drift
```bash
# Compare the two most recent snapshots
repostem drift

# Compare current snapshot with a specific baseline
repostem drift --since <snapshot-id>

# Drift for a specific repository
repostem drift -r /path/to/repo
```

### Ask AI Questions
```bash
# Get AI explanations about structural metrics
repostem ask "What are the risks in src/utils.js?"
repostem ask "What would break if I change src/components/Button.tsx?"
repostem ask "Is src/api/client.js fragile?"
```

## 📋 Commands

### `init`
Initialize repository for snapshot persistence with SQLite or PostgreSQL.

```bash
repostem init [options]
```

**Options:**
- `-r, --repo <path>`: Path to repository (default: current directory)
- `-s, --storage <type>`: Storage type - `sqlite` or `postgresql` (default: prompt)
- `-p, --db-path <path>`: Database path for SQLite or connection string for PostgreSQL

**Reconfiguration:**
If you run `repostem init` on an already initialized repository, you'll see options:
- **Reconfigure storage backend** - Change storage type/path while preserving repo_id
- **Reset persistence** - Delete all snapshots but keep repo record
- **Cancel** - Exit without changes

**Example:**
```bash
# Interactive mode
repostem init

# With flags
repostem init --storage sqlite --db-path .repostem.db
repostem init --storage postgresql --db-path postgresql://user:pass@localhost/db
```

### `analyze`
Run full structural analysis on the repository and print project-level structural summary.

If the repository has been initialized with `repostem init`, the analysis snapshot will be automatically persisted to the configured storage.

```bash
repostem analyze [options]
```

**Options:**
- `-r, --repo <path>`: Path to repository (default: current directory)
- `-o, --output <format>`: Output format - `text`, `json`, `table` (default: `text`)

**Example:**
```bash
repostem analyze -r ./my-project -o table
```

### `risk`
Compute structural risk for a specific file.

```bash
repostem risk <filePath> [options]
```

**Arguments:**
- `filePath`: File path to analyze

**Options:**
- `-r, --repo <path>`: Path to repository (default: current directory)
- `-o, --output <format>`: Output format - `text`, `json`, `table` (default: `text`)

**Example:**
```bash
repostem risk src/core/engine.ts -r ./my-project
```

### `impact`
Show transitive impact of a file - what other files would be affected by changes.

```bash
repostem impact <filePath> [options]
```

**Arguments:**
- `filePath`: File path to analyze

**Options:**
- `-r, --repo <path>`: Path to repository (default: current directory)
- `-o, --output <format>`: Output format - `text`, `json`, `table` (default: `text`)

**Example:**
```bash
repostem impact src/utils/helpers.js
```

### `cycles`
List circular dependency groups in the repository.

```bash
repostem cycles [options]
```

**Options:**
- `-r, --repo <path>`: Path to repository (default: current directory)
- `-o, --output <format>`: Output format - `text`, `json`, `table` (default: `text`)

**Example:**
```bash
repostem cycles -r ./my-project -o json
```

### `drift`
Detect architectural drift between snapshots. Compares structural metrics across snapshots to identify risk changes, impact changes, new cycles, and hotspot evolution.

```bash
repostem drift [options]
```

**Options:**
- `-r, --repo <path>`: Path to repository (default: current directory)
- `-b, --branch <name>`: Filter by branch (defaults to the current Git branch when in a Git repo)
- `--no-branch-filter`: Show snapshots from every branch (overrides branch detection)
- `--since <id>`: Snapshot ID to compare against (from history)
- `-o, --output <format>`: Output format - `text`, `json` (default: `text`)

**Example:**
```bash
# Compare the two most recent snapshots
repostem drift

# Compare current snapshot with a specific baseline
repostem drift --since 69b34f51-0ece-4072-b943-83f27328be84

# Drift analysis with JSON output
repostem drift -o json
```

### `history`
Display persisted snapshot history for the current repository. Requires the repository to be initialized with `repostem init`.

```bash
repostem history [options]
```

**Options:**
- `-r, --repo <path>`: Path to repository (default: current directory)
- `-b, --branch <name>`: Filter by branch (defaults to the current Git branch when in a Git repo)
- `--no-branch-filter`: Show snapshots from every branch (overrides branch detection)
- `-o, --output <format>`: Output format - `text`, `json`, `table` (default: `table`)

**Example:**
```bash
repostem history
repostem history -b main -o json
repostem history --no-branch-filter
```

### `hotspot`
Identify architectural hotspots - files with high structural risk and impact that warrant attention.

```bash
repostem hotspot [options]
```

**Options:**
- `-r, --repo <path>`: Path to repository (default: current directory)
- `-o, --output <format>`: Output format - `text`, `json` (default: `text`)

**Output includes:**
- Risk score with classification (Low/Medium/High)
- Impact ratio as percentage
- Churn score with classification
- Circular dependency indicator
- Overall hotspot score with classification

**Example:**
```bash
# Show current hotspots
repostem hotspot

# Hotspots for a specific repository
repostem hotspot -r /path/to/repo

# JSON output for integration
repostem hotspot -o json
```

### `ask`
AI explanation of file-level structural metrics and architectural questions.

```bash
repostem ask <question> [options]
```

**Arguments:**
- `question`: Question about a specific file or architectural concern

**Options:**
- `-r, --repo <path>`: Repository path (default: current directory)
- `-o, --output <format>`: Output format - `text`, `json`, `table` (default: `text`)

**Important**: The current version has limited support for questions and only recognizes specific keywords:

**Risk-related keywords**: `risk`, `risks`, `threat`, `threats`, `danger`, `hazard`, `fragile`
**Impact-related keywords**: `impact`, `impacts`, `consequence`, `consequences`, `effect`, `effects`, `result`, `results`

**Examples:**
```bash
# Risk analysis questions
repostem ask "What are the risks in src/utils.js?"
repostem ask "Is src/api/client.js fragile?"
repostem ask "What threats exist in src/components/Button.tsx?"

# Impact analysis questions  
repostem ask "What would be the impact of changing src/core/engine.ts?"
repostem ask "What are the consequences of modifying src/utils/helpers.js?"
repostem ask "Show me the effects of updating src/api/client.ts"
```

**Note**: Questions without these keywords may not be properly interpreted in the current version.

## 📊 Risk Metrics

RepoStem computes four key structural metrics, all normalized to 0.0-1.0 range:

### **Centrality** (Weight: 40%)
Measures how many files depend on a given file.
- **Formula**: `inDegree(F) / (totalFiles - 1)`
- **High values**: Critical files that many others depend on

### **Coupling** (Weight: 30%)
Measures structural connectivity (both incoming and outgoing dependencies).
- **Formula**: `(inDegree + outDegree) / (2 * (totalFiles - 1))`
- **High values**: Highly connected files with many dependencies

### **Churn** (Weight: 20%)
Measures historical volatility from git commit frequency.
- **Formula**: `commitCount(F) / maxCommits`
- **High values**: Frequently changed files that may be unstable

### **Circular Dependency** (Weight: 10%)
Binary penalty for files involved in circular dependencies.
- **Values**: 0 (no cycles) or 1 (part of a cycle)
- **Impact**: Files in cycles are inherently fragile

### **Risk Score Formula**
```
risk = 0.4*centrality + 0.3*coupling + 0.2*churn + 0.1*circularPenalty
```

**Interpretation:**
- **0.0-0.3**: Low structural risk
- **0.3-0.6**: Moderate structural risk  
- **0.6-1.0**: High structural risk

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY`: Required for AI-powered `ask` command

### Supported Languages
- **JavaScript** (.js, .jsx)
- **TypeScript** (.ts, .tsx)

### `.gitignore` Integration

By default (`respectGitignore: true`), RepoStem respects your `.gitignore` patterns. Set to `false` to analyze gitignored files.

## 📝 Output Formats

### Text Format
Human-readable output with colors and formatting:
```bash
repostem analyze -o text
```

### JSON Format
Machine-readable JSON for integration with other tools:
```bash
repostem analyze -o json
```

### Table Format
Structured tabular output for quick scanning:
```bash
repostem analyze -o table
```

## 🎯 Use Cases

### **Code Review**
```bash
# Before merging changes
repostem risk src/components/NewFeature.tsx
repostem impact src/components/NewFeature.tsx
```

### **Refactoring Planning**
```bash
# Identify risky files to refactor
repostem analyze
repostem cycles
```

### **Architecture Documentation**
```bash
# Generate architectural insights
repostem ask "What are the most critical files in this codebase?"
repostem ask "Which files have the highest coupling?"
```

### **Technical Debt Assessment**
```bash
# Identify technical debt hotspots
repostem analyze -o json | jq '.files[] | select(.risk > 0.6)'
```

## 🚨 Limitations

- **File-level analysis**: Currently analyzes at file level, not function level
- **JavaScript/TypeScript only**: Supports JS/TS repositories in v0.1
- **Git history required**: Churn analysis requires git repository
- **Heuristic risk scores**: Risk scores are heuristic-based, not statistically validated
- **OpenAI dependency**: AI features require OpenAI API key

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/your-org/repostem.git
cd repostem
pnpm install
pnpm build
```

### Running Tests
```bash
pnpm test
```

### Building CLI
```bash
cd apps/cli
pnpm build
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.

## 🔗 Links

- [RepoStem Documentation](../../docs/)
- [Core Engine](../../packages/engine/)
- [Examples](../../examples/)
- [Issues](https://github.com/your-org/repostem/issues)

## 🆘 Support

- **Documentation**: [docs/](../../docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/repostem/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/repostem/discussions)

---

**RepoStem** - AI-powered structural risk analysis for healthier codebases.
