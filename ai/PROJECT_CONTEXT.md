# RepoStem — AI Context Document

This document provides the complete architectural and conceptual context for RepoStem.

Any AI agent modifying this repository must follow the constraints and structure defined here.

Current active development version: v0.2.0  
v0.3.0 has NOT started [1].

---

# 1. Project Vision

RepoStem models software repositories as dependency graphs in order to surface:

- Structural risk
- Blast radius
- Architectural drift
- Structural hotspots
- Long-term system health trends

Long-term objective:

Build an architectural cognition engine capable of reasoning about how systems evolve structurally over time.

RepoStem is NOT:
- A linter
- A formatter
- A type checker
- An AI code generator
- A generic static analysis tool

It is a structural intelligence engine.

---

# 2. Roadmap

## Stage 1 — Structural Intelligence ✅ (Completed)

Core capabilities:
- Dependency graph construction
- Risk scoring
- Impact (blast radius) calculation
- Cycle detection
- Risk classification (LOW, MEDIUM, HIGH, CRITICAL)
- CLI reporting

Status: ✅ Completed (v0.1.x)

---

## Stage 2 — Temporal Evolution Tracking (Current Stage)

Version: v0.2.0  
Status: 🚧 In Progress

Capabilities being implemented:

- Snapshot persistence
- Snapshot repository abstraction
- Snapshot comparison (N vs N-1)
- Drift detection
- Hotspot ranking
- Structural trend detection
- Churn integration
- Temporal summaries

This stage introduces time-awareness into RepoStem.

Important constraint:
Temporal logic must operate only on SnapshotAggregate objects.

---

## Stage 3 — PR-Level Structural Cognition (Not Started)

Version: v0.3.0  
Status: ⛔ Not Started

Planned capabilities:

- Pull request structural analysis
- Pre-merge structural risk detection
- Structural diff without full snapshot persistence
- CI integration
- Structural regression warnings
- PR impact visualization

This stage introduces real-time structural feedback during development.

No implementation should assume Stage 3 features yet.

---

## Stage 4 — Governance & Contributor Modeling (Future)

Planned capabilities:

- Contributor-level structural impact analysis
- Risk ownership modeling
- Architectural boundary enforcement
- Structural governance rules
- Team-based hotspot clustering

Focus: socio-structural intelligence.

---

## Stage 5 — AI Project Brain (Long-Term Vision)

Planned capabilities:

- Structural reasoning assistant
- Natural language architectural queries
- Predictive structural risk modeling
- Automated architectural insights
- Long-term structural forecasting

AI must always explain computed data — never fabricate it.

---

# 3. Layered Architecture

RepoStem follows strict layered boundaries.

Violating these boundaries introduces architectural corruption.

---

## CLI Layer

Responsibilities:
- Parse arguments
- Invoke application use cases
- Format output

Must NOT:
- Perform structural computation
- Access database directly
- Compute risk or impact

---

## Application Layer

Responsibilities:
- Orchestrate use cases
- Call Core services
- Call Persistence repositories
- Coordinate Temporal comparisons

Must NOT:
- Compute structural metrics
- Contain SQL logic
- Contain AI prompt logic

---

## Core Layer

Responsibilities:
- Graph building
- Risk calculation
- Impact calculation
- Cycle detection
- Snapshot building

Must NOT:
- Import persistence
- Import AI
- Access database
- Read environment configuration

Core must remain pure and deterministic.

---

## Temporal Layer

Responsibilities:
- Compare snapshots
- Detect drift
- Rank hotspots
- Compute delta metrics

Must NOT:
- Rebuild dependency graph
- Recalculate raw structural metrics
- Access database directly

Temporal operates strictly on SnapshotAggregate objects.

---

## Persistence Layer

Responsibilities:
- SnapshotRepository abstraction
- Database adapters (SQLite/Postgres)
- Store and retrieve snapshots
- Schema management

Must NOT:
- Compute structural logic
- Recalculate metrics
- Import core computational modules

Persistence is storage-only.

---

## AI Layer

Responsibilities:
- Intent detection
- Prompt construction
- Provider abstraction
- Structured explanation generation

Must NOT:
- Compute risk
- Compute impact
- Modify snapshot data
- Recalculate metrics
- Access database directly

AI explains structured output — it does not generate structural truth.

---

# 4. Snapshot Model

Snapshots are immutable structural captures of a repository at a point in time.

## SnapshotAggregate Contains:

- Snapshot metadata (id, timestamp, repo_id, branch)
- FileSnapshot map
- Edges
- Cycles
- Summary metrics

Snapshots must not be mutated after creation.

Drift comparisons are always between:
- Latest snapshot (N)
- Previous snapshot (N-1)

Snapshots may represent dirty working tree states.
Commit metadata is informational only.

---

# 5. Hotspot Logic

Hotspot score formula:

hotspot_score =
  0.5 * risk_score +
  0.3 * impact_ratio +
  0.15 * churn +
  cycle_bonus

Hotspots represent:

- High structural fragility
- High blast radius
- High change frequency

Hotspot ranking belongs to Stage 2 (Temporal).

---

# 6. Drift Logic

Drift detection includes:

- risk_delta > threshold
- impact_delta > threshold
- new cycles
- removed cycles
- new dependencies
- removed dependencies
- new files
- deleted files

Thresholds must be centralized in configuration.

Drift operates on persisted snapshots only.

---

# 7. Architectural Rules (Strict)

- Core never imports persistence.
- Core never imports AI.
- Persistence never imports core computation logic.
- Temporal never recalculates structural metrics.
- AI never computes structural values.
- CLI never accesses database directly.
- SnapshotAggregate is immutable.
- Thresholds are centralized.

If a change weakens layer separation, it is incorrect.

---

# 8. Current Development Focus

We are currently implementing:

✅ Snapshot repository abstraction  
✅ Snapshot persistence  
✅ Drift detection  
✅ Hotspot ranking  
✅ Temporal comparison  

We are NOT implementing:

❌ PR analysis  
❌ CI integration  
❌ Governance modeling  
❌ AI structural reasoning  

Those belong to later stages.

---

# 9. Design Philosophy

RepoStem prioritizes:

- Determinism
- Immutability
- Storage abstraction
- Replaceable infrastructure
- Clear boundaries
- Testability
- Long-term extensibility

Short-term convenience must never override architectural integrity.

---

# 10. AI Behavior Constraints

When modifying this repository:

- Never fabricate metrics.
- Never infer data not present in SnapshotAggregate.
- Never override computed risk classifications.
- Never recompute structural values inside AI layer.
- Always respect layer boundaries defined above.

AI is interpretive — not authoritative.

---

End of context document.