# RepoStem Roadmap

This document describes the long-term roadmap for RepoStem. Stages are ordered from foundational infrastructure toward advanced architectural cognition.

---

## Stage 1 — Structural CLI (v0.1) ✅

File-level structural analysis for JavaScript and TypeScript repositories.

- Parse JS/TS repositories with Tree-sitter
- Build file-level dependency graph
- Compute centrality, coupling, churn
- Detect circular dependencies
- Calculate structural risk scores
- Expose results via CLI
- AI-powered explanation of metrics

---

## Stage 2 — Persistence & Temporal Evolution (v0.2) ✅

Track architectural evolution over time.

- Persist structural snapshots to SQLite or PostgreSQL
- `repostem init` for local storage configuration
- Snapshot history and comparison
- Architectural drift detection
- Hotspot identification and trend analysis
- `repostem ask` for evolution-aware questions

---

## Stage 3 — Server Foundation & Configurable Parameters (v0.3)

Make RepoStem deployable beyond the local CLI and expose its parameters to users.

### 3.1 Parameter system
- Centralize all risk, drift, hotspot, and signal thresholds
- Extend `.repostem.json` with a `parameters` section
- Add `repostem config` command to view and update parameters
- Add CLI flags to override parameters per command
- Support built-in profiles: `default`, `strict`, `permissive`, `churn-focused`, `structure-focused`

### 3.2 Server API
- Create `apps/server`
- REST API exposing all engine commands
- Support SQLite for development and PostgreSQL for production

### 3.3 CLI server target
- Add `--server-url` and `--server-api-key` to CLI
- `repostem init` can connect to a server instead of a local database

### 3.4 CI/CD mode
- Add `--ci` flag to CLI
- JSON-only output, deterministic exit codes
- Flags like `--fail-on-risk-high`, `--fail-on-new-cycles`
- Optional push to server for history

### 3.5 Database schema additions
- Add tables for GitHub App integration:
  - `github_installation`
  - `github_repo_mapping`

---

## Stage 4 — GitHub Integration & Automation (v0.4)

Integrate RepoStem into the GitHub pull request workflow.

### 4.1 Worker & queue infrastructure
- Async job queue for analysis tasks
- Background PR analysis and snapshot processing

### 4.2 Minimal server auth
- API keys for CLI and CI access
- GitHub webhook signature verification

### 4.3 GitHub App
- GitHub App installation
- Webhook handling for pull requests and pushes

### 4.4 PR-level structural impact analysis
- Analyze PR branch against base branch
- Detect structural changes, risk growth, and new cycles

### 4.5 PR comments and status checks
- Post structural analysis summaries as PR comments
- Set commit status checks based on configured thresholds

---

## Stage 5 — Structural Memory & Retrieval (v0.5)

Turn historical snapshots into searchable architectural memory.

### 5.1 Embeddings
- Generate embeddings for:
  - Snapshots
  - Drift summaries
  - Hotspots
  - PR structural diffs

### 5.2 Vector search
- Search over architectural history using semantic similarity
- Find patterns across snapshots and repositories

### 5.3 Semantic query layer for `repostem ask`
- Embed user questions
- Match against known structural intents and historical patterns
- Route to the appropriate engine
- Retrieve relevant structural context

### 5.4 Read-only Web UI
- Structural observability dashboard
- Visualize history, drift, hotspots, and dependency graph
- Display current parameters and active profile
- No parameter editing — configuration stays in `.repostem.json`

### 5.5 Function-level analysis
- Move beyond file-level dependency graphs
- Function-level call graph and metrics

---

## Stage 6 — Architectural Cognition Engine (v1.0)

The true "Project Brain" stage — predictive and reasoning capabilities.

### 6.1 Predictive drift modeling
- Forecast trajectory of risk and impact over time

### 6.2 Structural anomaly detection
- Detect unusual structural changes compared to historical baseline

### 6.3 Architectural regression forecasting
- Identify modules likely to become future hotspots

### 6.4 Pattern recognition over historical structural data
- Cluster similar structural changes and recurring patterns

### 6.5 Continuous monitoring mode
- Background structural analysis and alerting

### 6.6 AI-assisted architectural reasoning
- Constrained reasoning backed by deterministic structural data
- Natural language explanations grounded in metrics and history

### 6.7 Contributor & governance modeling
- Structural impact per contributor and per pull request
- Ownership and governance signals

---

## Notes

- RepoStem is an open-source project. This roadmap does not include a SaaS or cloud-only product plan.
- All stages are additive. Each stage builds on the persistence and analysis layers from previous stages.
- Stage 3 and Stage 4 are infrastructure and integration stages. Stage 5 and Stage 6 are intelligence stages.
