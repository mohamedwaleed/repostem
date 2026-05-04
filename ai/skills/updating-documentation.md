---
name: updating-documentation
description: Guidelines for updating project documentation (changelogs, READMEs, and architecture docs) when implementing features or fixes. Use this skill after completing code changes.
---

# Documentation Update Guidelines

## When to Update Documentation
Update documentation when:
- A new feature is implemented
- A new CLI command is added
- Breaking changes are introduced
- Configuration options change
- Architecture is modified
- Preparing for a release

## Files to Update

### 1. Changelogs
Update all three changelog files:

#### Root CHANGELOG.md
Location: `/CHANGELOG.md`
- Main project changelog
- Tracks high-level changes across all packages
- Use for user-visible changes

#### Package Changelogs
Location: `/apps/cli/CHANGELOG.md`, `/packages/engine/CHANGELOG.md`
- Package-specific changes
- Version bumps
- Dependency updates

### 2. README Files
Update README files when:

#### Root README.md
Location: `/README.md`
- Add new CLI commands to the command list
- Update feature descriptions
- Update installation instructions if needed
- Update configuration examples

#### CLI README.md
Location: `/apps/cli/README.md`
- Add new command documentation in Quick Start section
- Add detailed command documentation in Commands section
- Include usage examples
- Document options and flags

#### Engine README.md
Location: `/packages/engine/README.md`
- Document new APIs
- Update type definitions
- Add usage examples for new features

### 3. Architecture Document
Location: `/docs/architecture-v2.md`
- Update when architectural changes occur
- Document new layers or components
- Update database schema if changed
- Update capability lists

## Format Guidelines

### Changelog Format
Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

```markdown
## [Unreleased]

### Added
- Implement repostem hotspot command to identify architectural hotspots
- Add new configuration option X

### Changed
- Enhance hotspot output with classification labels and color coding
- Refactor metric responsibilities into structural layers

### Fixed
- Fix impact delta calculation to correctly show increased/decreased counts
```

**Rules:**
- Use imperative mood: "Implement X" not "Implemented X"
- Include GitHub issue number: `(#19)`
- One line per change
- Order: Added → Changed → Deprecated → Removed → Fixed → Security

### README Command Documentation Format

For new CLI commands, add to both Quick Start and Commands sections:

#### Quick Start Example
```markdown
### Identify Architectural Hotspots
```bash
# Show current architectural hotspots
repostem hotspot

# Hotspots for a specific repository
repostem hotspot -r /path/to/repo

# Hotspots with JSON output
repostem hotspot -o json
```
```

#### Commands Section Example
```markdown
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
```

### Architecture Document Format
Update relevant sections:

```markdown
## New Capabilities
- Add new capability description
- Explain architectural impact

## New Commands
- `repostem new-command` – Description of command
```

## Version Bumping
When updating documentation for a release:

1. **Root CHANGELOG.md**: Rename `[Unreleased]` to `[VERSION] - YYYY-MM-DD`
2. **Package CHANGELOG.md**: Add new version section with dependencies
3. **Package README.md**: No version bump needed
4. **CLI README.md**: No version bump needed

Example package changelog:
```markdown
## 0.1.7

### Patch Changes

- Add hotspot command to identify architectural hotspots
- Enhance hotspot output with classification labels (Low/Medium/High) and color coding
- Updated dependencies
  - @repostem/engine@0.1.7
```

## What to Include

### ✅ DO Include
- New CLI commands
- New configuration options
- Breaking changes
- API changes
- Architecture modifications
- Performance improvements
- Security fixes

### ❌ DON'T Include
- Internal refactoring without user impact
- Test changes
- Dependency updates without functional changes
- Trivial fixes
- Documentation-only changes (unless significant)

## Checklist Before Submitting

- [ ] Root CHANGELOG.md updated with issue references
- [ ] CLI CHANGELOG.md updated with version bump
- [ ] Engine CHANGELOG.md updated with version bump
- [ ] Root README.md updated (if new command/feature)
- [ ] CLI README.md updated with command documentation
- [ ] Architecture document updated (if architectural change)
- [ ] All entries use imperative mood
- [ ] Issue numbers included in changelog
- [ ] Examples are accurate and tested
- [ ] Options and flags are documented

## Common Patterns

### Adding a New CLI Command
1. Add to root CHANGELOG.md under Added
2. Add to CLI CHANGELOG.md with version bump
3. Add to root README.md command list
4. Add to CLI README.md Quick Start section
5. Add detailed command documentation in CLI README.md Commands section
6. Update architecture document if new capability

### Adding a New Feature
1. Add to root CHANGELOG.md under Added
2. Add to CLI CHANGELOG.md if it affects CLI
3. Add to Engine CHANGELOG.md if it affects engine
4. Update relevant README sections
5. Update architecture document if architectural change

### Fixing a Bug
1. Add to root CHANGELOG.md under Fixed
2. Add to relevant package CHANGELOG.md
3. Update README if user-visible bug fix
4. No architecture document update unless architectural bug

## Issue Reference Format
- Always reference the GitHub issue number
- Format: `(#issue-number)`
- Example: `(#19)`, `(#24)`
- Multiple issues: `(#12, #13, #14)`

## Breaking Changes
Mark breaking changes explicitly:
```markdown
### Changed
- **BREAKING**: Remove deprecated API endpoint (#20)
```

Also document in README:
```markdown
### Breaking Changes
- The `--legacy-flag` option has been removed
```
