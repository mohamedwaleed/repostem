# RepoStem — AI Contributor Guide

This guide defines how AI agents and contributors must work within RepoStem.

Follow these rules strictly.

---

# 1. Before Writing Code

Always:

1. Identify which layer the change belongs to.
2. Confirm it does not violate architectural boundaries.
3. Check if similar logic already exists.
4. Avoid duplicating structural computation.

If unsure about layer placement, default to:
- Core for computation
- Temporal for cross-snapshot comparison
- Persistence for storage
- Application for orchestration

---

# 2. Adding a New Structural Metric

New metric example: cohesion, instability, etc.

Steps:

1. Implement in Core layer.
2. Integrate into SnapshotAggregate.
3. Expose via application layer.
4. Do NOT compute inside CLI.
5. Do NOT compute inside AI layer.

Metrics must be deterministic.

---

# 3. Adding Temporal Logic

If feature compares snapshots:

- Place in Temporal layer.
- Operate only on SnapshotAggregate.
- Do not rebuild graph.
- Do not access database directly.

Application layer retrieves snapshots and passes them to temporal services.

---

# 4. Adding Persistence Features

When modifying storage:

- Update SnapshotRepository interface first.
- Then implement adapter logic.
- Do not expose SQL to application.
- Do not expose adapter directly to CLI.

Repository must operate in domain terms (SnapshotAggregate).

---

# 5. Adding AI Capabilities

AI must:

- Consume structured snapshot output.
- Generate explanations only.
- Never modify data.
- Never calculate structural metrics.

AI layer must use provider abstraction.

No provider-specific logic outside AI layer.

---

# 6. Testing Guidelines

Core layer:
- Pure unit tests
- No database
- No environment variables

Temporal layer:
- Use mocked snapshots
- No database calls

Persistence layer:
- Use test database
- Test repository contract

Application layer:
- Integration-level orchestration tests

---

# 7. Refactoring Rules

Allowed:
- Extract shared logic
- Improve clarity
- Improve naming
- Reduce duplication

Not allowed:
- Cross-layer shortcuts
- Introducing circular dependencies
- Adding DB calls to core
- Adding AI logic to core

---

# 8. Coding Conventions

- Prefer immutability
- Prefer pure functions
- Avoid global state
- Use descriptive names
- Keep files focused
- Keep layers isolated

---

# 9. Commit Philosophy

Commits should:

- Represent a single logical change
- Respect architecture
- Not mix refactor + feature
- Not introduce silent behavior change

---

# 10. When Unsure

If implementing something feels like:

- It needs DB access in core → wrong
- It needs AI to compute metrics → wrong
- It needs CLI to calculate risk → wrong

Re-evaluate layer placement.

---

# 11. Golden Rule

If a change makes boundaries less clear, it is probably incorrect.

RepoStem’s long-term power depends on architectural discipline.

Protect it.

---

End of contributor guide.