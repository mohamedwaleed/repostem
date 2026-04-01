# RepoStem Architecture v0

## Vision

RepoStem models repositories as dependency graphs and computes structural risk metrics to help developers understand architectural fragility.

The long-term vision is to evolve RepoStem into an AI cognition layer for repositories — capable of reasoning about architecture, evolution, and structural health over time.

---

# v0.1 Scope

RepoStem v0.1 focuses on structural intelligence at the file level.

Included:

- Parse JS/TS repositories
- Build file-level dependency graph
- Detect circular dependencies
- Compute centrality
- Compute churn from git history
- Calculate structural risk score
- Expose CLI interface
- Provide AI explanation of computed metrics

Not included:

- GitHub App
- Persistent database storage
- Architecture drift tracking
- Contributor modeling
- Multi-language support
- Function-level call graph analysis

---

# System Architecture Diagram

```
Repo → Parser → Dependency Graph → Metrics Engine → Risk Engine → AI Explanation → CLI Output
```

Each component has a single responsibility and operates sequentially.

---

# Component Breakdown

## 1️⃣ Repo

### What it is:
The target codebase being analyzed.

### What it provides:
- Source files
- Directory structure
- Git history

### Purpose:
The repository is the raw input to the system. RepoStem reads from it but does not modify it.

---

## 2️⃣ Parser

### What it does:
Reads source files and extracts structural information using AST parsing.

### Technology:
- Tree-sitter (JavaScript & TypeScript grammars)

### Extracted Information:
For each file:
- Import statements
- Export statements (optional)
- File path
- Basic metadata (size, extension)

### Example Output:

```json
{
  "file": "src/auth/token.ts",
  "imports": [
    {
        source: "./controllers/user-controller",
        resolvedPath: "src/controllers/user-controller.ts",  // ✅ Relative to repo root
        isExternal: false
    }
    {
        source: "./services/user-service",
        resolvedPath: "src/services/user-service.ts",        // ✅ Relative to repo root
        isExternal: false
    },
    { source: 'typescript', resolvedPath: null, isExternal: true }
  ],
  exports: []
}
```

### Purpose:
Transforms raw source code into structured dependency data.

---

## 3️⃣ Dependency Graph

### What it does:
Constructs a directed graph from parser output.

### Node:
- File (each source file is a node)

### Edge:
- Import relationship (File A → File B)

Example:

```
token.ts → client.ts
token.ts → logger.ts
```

### Data Structure (v0.1):
In-memory graph representation:

```ts
Map<string, Set<string>>
```

Where:
- Key = file path
- Value = set of files it depends on

### Purpose:
Provides a mathematical representation of repository architecture.

All structural analysis is derived from this graph.

---

## 4️⃣ Metrics Engine

### What it does:
Computes structural metrics using the dependency graph and git history.

### Inputs:
- Dependency graph
- Git history data

### Metrics Computed:

#### Centrality
Measures how many files depend on a given file.
Computed as normalized in-degree.

#### Coupling
Measures how connected a file is.
Computed as incoming edges + outgoing edges.

#### Circular Dependency
Determines whether a file participates in a dependency cycle.
Detected using graph traversal (DFS or strongly connected components).

#### Churn
Measures historical volatility.
Computed from git commit frequency over a defined time window.

### Example Output:

```json
{
  "centrality": 0.81,
  "coupling": 0.74,
  "churn": 0.67,
  "hasCircularDependency": true
}
```

### Purpose:
Converts architectural structure into measurable signals.

This layer is deterministic and contains no AI logic.

---

## 5️⃣ Risk Engine

### What it does:
Combines structural metrics into a single interpretable risk score.

### v0.1 Risk Formula (Heuristic-Based):

```
risk =
  w1 * centrality +
  w2 * coupling +
  w3 * churn +
  w4 * circularPenalty
```

Where:
- Weights (w1–w4) are heuristic values
- circularPenalty is binary (0 or 1)

### Important Note:
Risk scoring in v0.1 is heuristic-based and intended as a structural signal, not a statistical prediction of failure.

### Example Output:

```json
{
  "riskScore": 0.83
}
```

### Purpose:
Transforms multiple structural signals into a single decision-support metric.


---


## 6️⃣ AI Explanation Layer

### What it does:
Converts structured metrics into natural language reasoning.

### Input:
Structured JSON containing:
- centrality
- coupling
- churn
- circular dependency status
- risk score

### Example Prompt (Simplified Concept):

"Given the following structural metrics, explain why this file may be fragile."

### Output:
Human-readable explanation grounded in computed data.

### Purpose:
Bridges mathematical metrics and human interpretation.

The AI does not compute structural metrics. It only explains them.

---

## 7️⃣ CLI Output

### What it does:
Presents final results to the user.

### Example Output:

```
File: src/auth/token.ts
Risk Level: HIGH (0.83)

Reasons:
- High dependency centrality
- Strong coupling with core modules
- Frequent historical changes
- Participates in circular dependency
```

### Purpose:
Acts as the user interface layer for v0.1.

---

# Conceptual Data Model (v0.1)

RepoStem v0.1 does not use a database, but defines the following logical entities:

## File
Represents a source file in the repository.

Fields:
- id
- path
- commitCount
- churnScore

---

## Dependency
Represents an edge between two files.

Fields:
- fromFileId
- toFileId
- type (IMPORT)

---

## Metrics
Represents computed structural metrics for a file.

Fields:
- fileId
- centrality
- coupling
- churn
- hasCircularDependency
- riskScore

---

## Cycle
Represents a detected circular dependency group.

Fields:
- cycleId
- fileIds (array)

---

# Architectural Principles (v0.1)

- Deterministic structural analysis first
- AI as interpretive layer, not computational layer
- File-level graph for simplicity and scalability
- Clear separation of concerns between components
- Designed for future extensibility (function-level graph, persistence, GitHub integration)

---

# Metrics Calculations (v0.1)

This section defines how structural metrics are computed in RepoStem v0.1.

All metrics are deterministic and derived from:

- Dependency graph
- Git history

---

## 1️⃣ Centrality

### Purpose
Measures how many other files depend on a given file.
High centrality implies high structural importance.

### Raw Calculation (In-Degree)

For each file `F`:

```
inDegree(F) = number of files that import F
```

### Normalization

To keep centrality comparable across repositories:

```
centrality(F) = inDegree(F) / (totalFiles - 1)
```

Range:
```
0.0 → 1.0
```

If a file is imported by every other file, centrality approaches 1.

---

## 2️⃣ Coupling

### Purpose
Measures how structurally connected a file is.

High coupling indicates:

- Many dependencies
- Large blast radius
- Increased fragility

### Raw Calculation

For each file `F`:

```
afferentCoupling = inDegree(F)
efferentCoupling = outDegree(F)

rawCoupling(F) = afferentCoupling + efferentCoupling
```

Where:

- inDegree = number of files depending on F
- outDegree = number of files F depends on

### Normalization

```
maxPossibleCoupling = 2 * (totalFiles - 1)

coupling(F) = rawCoupling(F) / maxPossibleCoupling
```

Range:
```
0.0 → 1.0
```

---

## 3️⃣ Circular Dependency

### Purpose
Detects structural cycles which increase fragility.

### Detection Algorithm

Use:

- Depth-First Search (DFS)
OR
- Strongly Connected Components (Tarjan’s Algorithm)

If file `F` belongs to a cycle of size > 1:

```
hasCircularDependency(F) = true
```

### Circular Penalty

Binary penalty:

```
circularPenalty(F) = 1 if true
                   = 0 if false
```

Future versions may scale penalty by cycle size.

---

## 4️⃣ Churn

### Purpose
Measures historical volatility of a file.

High churn suggests:

- Frequent modification
- Instability
- Higher likelihood of regression

### Raw Calculation

Using git history:

```
commitCount(F) = number of commits touching F
```

Within a defined time window (e.g., last 6 months).

### Normalization

Let:

```
maxCommits = highest commit count among all files
```

Then:

```
churn(F) = commitCount(F) / maxCommits
```

Range:
```
0.0 → 1.0
```

If repository is very stable, churn values remain low overall.

---

# Risk Score Calculation (v0.1)

## Purpose

Combine multiple structural signals into a single interpretable metric.

This score is heuristic-based and intended as a decision-support signal.

---

## Formula

```
risk(F) =
  w1 * centrality(F) +
  w2 * coupling(F) +
  w3 * churn(F) +
  w4 * circularPenalty(F)
```

### Default Weights (v0.1)

```
w1 (centrality) = 0.4
w2 (coupling)   = 0.3
w3 (churn)      = 0.2
w4 (circular)   = 0.1
```

Constraints:

```
w1 + w2 + w3 + w4 = 1.0
```

---

## Output Range

```
risk(F) ∈ [0.0, 1.0]
```

Interpretation:

| Risk Score | Interpretation |
|------------|---------------|
| 0.0 – 0.3  | Low structural risk |
| 0.3 – 0.6  | Moderate structural risk |
| 0.6 – 1.0  | High structural risk |

---

# Design Rationale

- Centrality captures structural importance.
- Coupling captures structural complexity.
- Churn captures historical instability.
- Circular dependency captures architectural violation.

Together they approximate structural fragility.

---

# Limitations (v0.1)

- Risk score is heuristic, not statistically validated.
- Function-level interactions are not modeled.
- Dynamic imports may not be fully resolved.
- Git churn does not distinguish feature commits from bug fixes.

Future versions may incorporate:

- Regression correlation
- Weighted churn decay over time
- Module-level aggregation
- Contributor-based risk adjustments

---

# Future Evolution

Stage 2:
- Persistent storage
- Temporal drift tracking
- Background worker process

Stage 3:
- GitHub App integration
- PR-level structural impact analysis

Stage 4:
- Contributor modeling
- Governance intelligence
- Multi-language support

Stage 5:
- Full AI Project Brain