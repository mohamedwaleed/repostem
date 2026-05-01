# RepoStem Architecture v2

## Vision

RepoStem models repositories as dependency graphs and computes structural risk metrics to help developers understand architectural fragility.

The long-term vision is to evolve RepoStem into an AI cognition layer for repositories — capable of reasoning about architecture, evolution, and structural health over time.

---

# v0.2 Scope

RepoStem now supports architectural evolution tracking across snapshots.

## New Capabilities
- Persist structural snapshots over time
- Detect architectural drift (risk growth, impact growth, new cycles)
- Track evolving hotspots
- Compare structural state across snapshots
- Expand ask to answer temporal questions

## New Commands
- `repostem init` – Enable persistence and initialize snapshot storage
- `repostem analyze` – Save structural snapshot if storage is enabled
- `repostem drift` – Compare latest persisted snapshot (N) with previous persisted snapshot (N-1)
- `repostem history` – View snapshot history
- `repostem hotspots` – Current architectural hotspots
- `repostem hotspots --trend` – Hotspot evolution over time
- `repostem ask` – Evolution-aware questions about the repository structure

--- 

## Database Schema

### repo
id TEXT PRIMARY KEY
root_path TEXT
created_at TIMESTAMP

### snapshot
id TEXT PRIMARY KEY
repo_id TEXT NOT NULL
git_remote_url TEXT
branch TEXT
commit_hash TEXT
working_tree_dirty BOOLEAN
total_files INTEGER
cycle_count INTEGER
created_at TIMESTAMP

### file_snapshot
snapshot_id TEXT
file_path TEXT
dependency_importance REAL
connectivity REAL
churn REAL
risk_score REAL
risk_level TEXT CHECK (risk_level IN ('HIGH', 'MEDIUM', 'LOW'))
impact_count INTEGER
PRIMARY KEY (snapshot_id, file_path)

### dependency_edge
snapshot_id TEXT
from_file TEXT
to_file TEXT
PRIMARY KEY (snapshot_id, from_file, to_file)

### cycle
id TEXT PRIMARY KEY
snapshot_id TEXT NOT NULL
nodes TEXT NOT NULL
FOREIGN KEY (snapshot_id) REFERENCES snapshot(id) ON DELETE CASCADE

---

## DDL (PostgreSQL & SQLite Compatible)

```sql
-- Enable foreign keys for SQLite (run before other DDL)
PRAGMA foreign_keys = ON;

CREATE TABLE repo (
    id TEXT PRIMARY KEY,
    root_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE snapshot (
    id TEXT PRIMARY KEY,
    repo_id TEXT NOT NULL,
    git_remote_url TEXT,
    branch TEXT,
    commit_hash TEXT,
    working_tree_dirty BOOLEAN DEFAULT FALSE,
    total_files INTEGER,
    cycle_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE
);

CREATE TABLE file_snapshot (
    snapshot_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    dependency_importance REAL,
    connectivity REAL,
    churn REAL,
    risk_score REAL,
    risk_level TEXT CHECK (risk_level IN ('HIGH', 'MEDIUM', 'LOW')),
    impact_count INTEGER DEFAULT 0,
    PRIMARY KEY (snapshot_id, file_path),
    FOREIGN KEY (snapshot_id) REFERENCES snapshot(id) ON DELETE CASCADE
);

CREATE TABLE dependency_edge (
    snapshot_id TEXT NOT NULL,
    from_file TEXT NOT NULL,
    to_file TEXT NOT NULL,
    PRIMARY KEY (snapshot_id, from_file, to_file),
    FOREIGN KEY (snapshot_id) REFERENCES snapshot(id) ON DELETE CASCADE
);

CREATE TABLE cycle (
    id TEXT PRIMARY KEY,
    snapshot_id TEXT NOT NULL,
    nodes TEXT NOT NULL,
    FOREIGN KEY (snapshot_id) REFERENCES snapshot(id) ON DELETE CASCADE
);

CREATE INDEX idx_snapshot_repo_id ON snapshot(repo_id);
CREATE INDEX idx_snapshot_created_at ON snapshot(created_at);
CREATE INDEX idx_file_snapshot_snapshot_id ON file_snapshot(snapshot_id);
CREATE INDEX idx_dependency_edge_snapshot_id ON dependency_edge(snapshot_id);
```

**Notes:**
- `UUID` → `TEXT` (SQLite compatible, store as string)
- `JSONB` → `TEXT` (store as JSON string, parse in application)
- `FLOAT` → `REAL` (standard SQL type)
- Add indexes for common query patterns
- Foreign key cascade for cleanup

---
# Detect architectural drifts

in v1, we have computed the following metrics for each file:
- dependency_importance (centrality)
- connectivity (coupling)
- churn (change frequency from git history)
- risk_score (calculated risk score)
- risk_level (HIGH, MEDIUM, LOW)
- impact_count (blast radius - number of files impacted based on transitive dependencies)

in v2, we can use these metrics to detect architectural drifts by comparing the current state with the previous state.

## comparison logic

After the users opted to persist snapshots via the config file using `repostem init`, the analyze command  `repostem analyze` will automatically store the snapshot in the SQL database.

the user can then run `repostem drift` to compare the current state with the previous state and detect architectural drifts.

the comparison logic will be as follows:
- compare the current state with the previous state (N and N-1 snapshots)
- detect changes in the metrics (dependency_importance, connectivity, churn, risk_score, risk_level, impact_count)
- detect new cycles
- detect new dependencies
- detect new files
- detect removed files
- detect removed dependencies
- detect removed cycles


# new commands logic

## repostem init
- check if a config file `.repostem.json` exists in the current directory
- if the file exists and the repo is already initialized, present the user with options:
  1. Reconfigure storage backend (change storage type/path while preserving repo_id)
  2. Reset persistence (delete all snapshots but keep repo record)
  3. Cancel
- if the file does not exist, ask the user to select the storage type (SQLite or PostgreSQL)
- if SQLite, create a SQL database file `.repostem.db` in the current directory (or custom path)
- if PostgreSQL, ask the user to provide the connection string
- save the config file `.repostem.json` in the current directory
- the config file will contain the following fields:
  - storage_type (SQLite or PostgreSQL)
  - storage_path (path to the SQL database file for SQLite or connection string for PostgreSQL)
  - repo_id (unique identifier for the repository)
- initialize the database schema
- generate a repo_id using UUID and save it in the table `repo` along with the root path
- when reconfiguring storage, the existing repo_id is preserved to maintain identity across storage changes

## repostem analyze
- check if a config file `.repostem.json` exists in the current directory
- check if the storage is configured (storage_type and storage_path are set)
- if not, run the analysis logic without storing the snapshot and display a warning message that the snapshot will not be persisted
- if yes, load the config file and connect to the SQL database
- run the analysis logic
- store the snapshot in the SQL database and display a warning in case of error 

## repostem drift
- check if the config file `.repostem.json` exists in the current directory
- check if the storage is configured (storage_type and storage_path are set)
- if not, print an error message that can not connect to the SQL database due to missing config file so unable to detect drifts and exit
- if yes, load the config file and connect to the SQL database
- if this is a git repository, load the previous two snapshots from the current branch from the SQL database
- if this is not a git repository, load the previous two snapshots from the SQL database by timestamp
- if there is no previous two snapshots, print an error message that there is not enough snapshots to compare and exit
- compare the two snapshots and detect architectural drifts as discribed above

### option --since <id>
- if the user provides the --since option, if it is a git repository load the last snapshot from the current branch with the specified ID  from the current branch and compare the current state with it
- if it is not a git repository, load the snapshot with the specified ID and compare the current state with it


### Architecture complexity calculation
w1 (edge_density) = 0.3
w2 (cycle_ratio) = 0.4
w3 (avg_connectivity) = 0.3

complexity_score =
  0.3 * edge_density +
  0.4 * cycle_ratio +
  0.3 * avg_connectivity

#### Filtering Rules
Only show:

risk_delta > 0.05
impact_delta_ratio > 0.05
new cycles
new files entering hotspot list

#### Example output
=== Architectural Drift (Snapshot N vs N-1) ===

Previous Snapshot:
- Commit: abc123
- Dirty: false
- Date: 2025-04-17

Current Snapshot:
- Commit: abc123
- Dirty: true
- Date: 2025-04-17

----------------------------------------

Risk Changes:
- 2 files increased risk level
- 1 file decreased risk level

↑ ui/src/ui/app-render.ts
  Risk: 0.28 → 0.34 (+0.06)

↑ src/gateway/server.ts
  Risk: 0.21 → 0.29 (+0.08)

----------------------------------------

Impact Changes:
- 3 files increased blast radius

↑ ui/src/ui/app-render.ts
  Impact: 48% → 63% (+15%)

↑ src/api/router.ts
  Impact: 12% → 19% (+7%)

----------------------------------------

Dependency Changes:
- 5 new structural edges introduced
- 2 edges removed

----------------------------------------

Cycle Changes:
- 1 new cyclic group detected
- 0 cycles resolved

New Cycle (3 files):
  - ui/src/ui/app-settings.ts
  - ui/src/ui/app-lifecycle.ts
  - ui/src/ui/app-render.ts

----------------------------------------
Hotspot Changes:

New Hotspots:
+ ui/src/ui/app-render.ts
  Score: 0.41 → 0.33 (-0.08)

Resolved Hotspots:
- src/api/router.ts
  Score: 0.29 → 0.38 (+0.09)

----------------------------------------
Summary:
Architectural complexity is increasing.
Risk and blast radius are growing in the UI layer.


## repostem history
- check if the config file `.repostem.json` exists in the current directory
- if not, print an error message that can not connect to the SQL database due to missing config file so unable to show history and exit
- if yes, load the config file and connect to the SQL database
- check if the storage is configured (storage_type and storage_path are set)
- if not, print an error message that can not connect to the SQL database due to missing config file so unable to show history and exit
- if yes, load all snapshots from the SQL database by current branch if it is a git repository or by the current timestamp if it is not a git repository
- display the snapshots with the following columns:
  - snapshot_id
  - created_at
  - commit_hash
  - total_files
  - cycle_count
  - branch

## repostem hotspots
- computes the hostpot score for each file based on the risk score , impact ratio , churn and cycle bonus
`cycle_bonus = 0.05 if file is in a cycle else 0`
```javascript
hotspot_score =
  (risk_score * 0.5) +
  (normalized_impact_ratio * 0.3) +
  (churn * 0.15) +
  (cycle_bonus)
```
- Filter out files with a hotspot score below a certain threshold (e.g., 0.35), this might be change after collecting more data from more repos
- sort the files by the hostpot score in descending order
- display the top 5 files with the highest hostpot score

#### Example Output

Architectural Hotspots (Current Snapshot)

1. ui/src/ui/app-render.ts
   - Risk: Medium (0.34)
   - Impact: 63.8%
   - Part of 8-file cycle
   - High churn
   - Hotspot Score: 0.51

2. src/gateway/server.ts
   - Risk: Low (0.22)
   - Impact: 28%
   - Very high churn
   - Hotspot Score: 0.38

### option --trend
- check if the config file `.repostem.json` exists in the current directory
- if not, print an error message that can not connect to the SQL database due to missing config file so unable to show hotspots and exit
- if yes, load the config file and connect to the SQL database
- check if the storage is configured (storage_type and storage_path are set)
- if not, print an error message that can not connect to the SQL database due to missing config file so unable to show hotspots and exit
- load previous two snapshots from the SQL database by current branch if it is a git repository or by the current timestamp if it is not a git repository
- compute risk delta and impact delta for each file
- compute hostspot score for each file based on the risk delta and impact delta 
```javascript
const trendScore =
      (riskDelta * 0.6) +
      (normalizeImpactDelta(impactDelta) * 0.4);
```
- filter out files with a trend score below a certain threshold (e.g., 0.5)
- sort the files by the hostspot score in descending order
- display the top 5 files with the highest hostspot score

#### Example Output
Architectural Hotspots (Trending):
1. ui/src/ui/app-render.ts
   Risk: 0.28 → 0.34 (+0.06)
   Impact: 48% → 63% (+15%)

2. src/gateway/server.ts
   Risk: 0.21 → 0.29 (+0.08)
   Impact stable

## repostem ask
in this version, this command will cover more qeustions allowing the users to ask the ai to explain 
1. Drift Summary Questions
2. Hostspots of the overall architecture
3. Trend Questions

### logic example
```
  if (includes(question, ["getting worse", "trend", "increasing"])) {
    return "fileTrend";
  }

  if (includes(question, ["changed", "drift"])) {
    return "driftSummary";
  }

  if (includes(question, ["hotspot", "biggest problem"])) {
    return "hotspots";
  }
```

## Architectural Principles (v2)

- Snapshots are immutable.
- Drift compares persisted snapshots only.
- Direct dependency edges are stored; transitive dependencies are computed.
- Thresholds are opinionated and centralized.
- AI never computes structural metrics; it only explains deterministic results.
- Snapshots represent structural state at time T, not Git commit state (Snapshots may represent uncommitted working tree states.
Commit metadata is informational only.)
- Persistence is optional and configured via `repostem init`.
- Running `repostem init` again does not regenerate `repo_id` unless explicitly reset