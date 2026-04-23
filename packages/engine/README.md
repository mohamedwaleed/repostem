# @repostem/engine

AI-powered structural risk analysis engine for code repositories. Parse repositories, build dependency graphs, compute architectural health metrics, and identify fragile code.

## Features

- **Dependency Graph Analysis**: Build in-memory dependency graphs from repository code
- **Structural Metrics**: Compute centrality, coupling, churn, and circular dependency detection
- **Risk Scoring**: Calculate weighted risk scores to identify fragile files
- **Impact Analysis**: Determine which files are affected by changes to a specific file
- **Cycle Detection**: Identify circular dependencies in your codebase
- **AI-Powered Explanations**: Get natural language explanations of risk and impact analysis
- **Multi-Language Support**: Currently supports JavaScript and TypeScript (extensible architecture)

## Installation

```bash
npm install @repostem/engine
# or
pnpm add @repostem/engine
# or
yarn add @repostem/engine
```

## Quick Start

```typescript
import { analyzeRepository, analyzeFileRisk, computeFileImpact } from '@repostem/engine';

// Analyze entire repository
const analysis = await analyzeRepository('/path/to/your/repo');
console.log(`Total files: ${analysis.totalFiles}`);
console.log(`High risk files:`, analysis.topRiskFiles);

// Analyze specific file risk
const risk = await analyzeFileRisk('/path/to/your/repo', 'src/core/service.ts');
console.log(`Risk score: ${risk.riskScore}`);
console.log(`Centrality: ${risk.centrality}`);

// Compute file impact
const impact = await computeFileImpact('/path/to/your/repo', 'src/core/service.ts');
console.log(`Files affected: ${impact.totalImpactCount}`);
```

## API Reference

### `analyzeRepository(repoPath: string)`

Analyzes an entire repository and returns project-level metrics.

```typescript
const result = await analyzeRepository('/path/to/repo');

// Returns:
{
  totalFiles: number;
  totalDependencies: number;
  cycleCount: number;
  topCentralFiles: RankedFile[];
  highChurnFiles: RankedFile[];
  topRiskFiles: RankedFile[];
}
```

### `analyzeFileRisk(repoPath: string, filePath: string)`

Analyzes a specific file's structural risk.

```typescript
const result = await analyzeFileRisk('/path/to/repo', 'src/file.ts');

// Returns:
{
  file: string;
  centrality: number;        // 0-1, how many files depend on this file
  coupling: number;          // 0-1, structural connectivity
  churn: number;             // 0-1, historical volatility
  hasCircularDependency: boolean;
  riskScore: number;         // 0-1, weighted risk score
}
```

### `computeFileImpact(repoPath: string, filePath: string)`

Computes the impact of changing a specific file.

```typescript
const result = await computeFileImpact('/path/to/repo', 'src/file.ts');

// Returns:
{
  file: string;
  directDependents: string[];
  transitiveDependents: string[];
  totalImpactCount: number;
  impactRatio: number;       // proportion of files affected
}
```

### `detectRepositoryCycles(repoPath: string)`

Detects circular dependencies in the repository.

```typescript
const cycles = await detectRepositoryCycles('/path/to/repo');

// Returns:
{
  files: string[];
}[]
```

### `ask(question: string, repoPath: string)`

Ask natural language questions about your repository (AI-powered).

```typescript
const answer = await ask('What is the risk of src/core/service.ts?', '/path/to/repo');
// Returns natural language explanation of the risk
```

### `classify(repoPath: string)`

Classifies repository structure and patterns.

```typescript
const classification = await classify('/path/to/repo');
```

### `initializeRepo(repositoryRoot: string, options: InitRepoOptions)`

Initialize repository for snapshot persistence with SQLite or PostgreSQL.

```typescript
const result = await initializeRepo('/path/to/repo', {
  storageType: 'sqlite',
  storagePath: '.repostem.db',
  repoId: 'optional-existing-repo-id' // for reconfiguration
});

// Returns:
{
  success: boolean;
  repoId: string;
  config: RepoStemConfig;
  migrationResult: MigrationResult;
  message: string;
}
```

**Note**: When reconfiguring storage, provide the existing `repoId` to preserve repository identity.

### `isRepoInitialized(repositoryRoot: string)`

Check if a repository is initialized for persistence.

```typescript
const initialized = isRepoInitialized('/path/to/repo');
// Returns: boolean
```

### `resetPersistence(repositoryRoot: string)`

Reset persistence by deleting all snapshots for a repository while keeping the repo record.

```typescript
const result = await resetPersistence('/path/to/repo');

// Returns:
{
  success: boolean;
  message: string;
  snapshotsDeleted: number;
}
```

## Metrics Explained

### Centrality
Measures how many files depend on a given file. High centrality indicates a file that is widely used throughout the codebase.

- **Range**: 0.0 - 1.0
- **Formula**: `inDegree(F) / (totalFiles - 1)`

### Coupling
Measures structural connectivity through both incoming and outgoing dependencies.

- **Range**: 0.0 - 1.0
- **Formula**: `(inDegree + outDegree) / (2 * (totalFiles - 1))`

### Churn
Measures historical volatility based on git commit frequency.

- **Range**: 0.0 - 1.0
- **Formula**: `commitCount(F) / maxCommits`

### Risk Score
Weighted combination of metrics to identify fragile code.

- **Range**: 0.0 - 1.0
- **Formula**: `0.4*centrality + 0.3*coupling + 0.2*churn + 0.1*circularPenalty`

**Interpretation**:
- 0.0 - 0.3: Low structural risk
- 0.3 - 0.6: Moderate structural risk
- 0.6 - 1.0: High structural risk

## Configuration

### Ignore Patterns

The engine respects `.gitignore` and additional ignore patterns. You can configure custom ignore patterns through the config loader.

### AI Explanation

For AI-powered explanations, you'll need to configure an OpenAI API key:

```typescript
import { setAIService } from '@repostem/engine';
import { OpenAIProvider } from '@repostem/engine';

setAIService(new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY
}));
```

## Language Support

Currently supports:
- JavaScript (ES6+)
- TypeScript

The parser architecture is extensible. You can add support for additional languages by implementing the `LanguageParser` interface.

## Architecture

The engine is organized into several layers:

1. **Parser**: Tree-sitter-based AST parsing for JS/TS
2. **Dependency Graph**: In-memory graph representation of file dependencies
3. **Metrics Engine**: Computes centrality, coupling, churn, and circular dependencies
4. **Risk Engine**: Calculates weighted risk scores
5. **AI Explanation Layer**: Converts metrics to natural language explanations

## Contributing

Contributions are welcome! Please see the main [RepoStem repository](https://github.com/mohamedwaleed/repostem) for contribution guidelines.

## License

MIT

## Related Packages

- [@repostem/cli](https://www.npmjs.com/package/@repostem/cli) - CLI tool for using this engine from the command line
