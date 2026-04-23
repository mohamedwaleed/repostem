-- RepoStem Database Schema v1
-- Compatible with both SQLite and PostgreSQL

-- Enable foreign keys for SQLite (ignored by PostgreSQL)
PRAGMA foreign_keys = ON;

-- Repository table: stores repo metadata
CREATE TABLE IF NOT EXISTS repo (
    id TEXT PRIMARY KEY,
    root_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Snapshot table: stores structural snapshots of the repository
CREATE TABLE IF NOT EXISTS snapshot (
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

-- File snapshot table: stores per-file metrics for each snapshot
CREATE TABLE IF NOT EXISTS file_snapshot (
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

-- Dependency edge table: stores file-to-file dependency edges
CREATE TABLE IF NOT EXISTS dependency_edge (
    snapshot_id TEXT NOT NULL,
    from_file TEXT NOT NULL,
    to_file TEXT NOT NULL,
    PRIMARY KEY (snapshot_id, from_file, to_file),
    FOREIGN KEY (snapshot_id) REFERENCES snapshot(id) ON DELETE CASCADE
);

-- Cycle table: stores detected cycles
CREATE TABLE IF NOT EXISTS cycle (
    id TEXT PRIMARY KEY,
    snapshot_id TEXT NOT NULL,
    nodes TEXT NOT NULL,
    FOREIGN KEY (snapshot_id) REFERENCES snapshot(id) ON DELETE CASCADE
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_snapshot_repo_id ON snapshot(repo_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_created_at ON snapshot(created_at);
CREATE INDEX IF NOT EXISTS idx_file_snapshot_snapshot_id ON file_snapshot(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_dependency_edge_snapshot_id ON dependency_edge(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_cycle_snapshot_id ON cycle(snapshot_id);
