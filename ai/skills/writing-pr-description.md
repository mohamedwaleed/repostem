---
name: writing-pr-description
description: Guidelines for writing PR descriptions following open source project standards. Use this skill when preparing to submit a pull request.
---

# PR Description Guidelines

## Purpose
Write clear, comprehensive PR descriptions that help reviewers understand changes quickly and facilitate smooth code review.

## Standard Format

Follow this structure:

```markdown
## Summary
[Brief 1-2 sentence summary of what this PR does]

## Changes
### Added
- New feature/command X
- New configuration option Y

### Changed
- Refactored component X
- Enhanced output format Y

### Fixed
- Fix bug X
- Resolve issue Y

## Documentation
- Updated CHANGELOG.md
- Updated README.md
- Added documentation for X

## Example Usage
```bash
# Example command
repostem command --option
```

## Example Output
```
Example output here
```

## Testing
- Test A passes
- Test B passes
- Manual testing performed
```

## Section Guidelines

### Summary
- 1-2 sentences maximum
- Describe what, not why
- Focus on user-visible impact
- Example: "Add hotspot command to identify architectural hotspots"

### Changes
Group by category:
- **Added**: New features, commands, options
- **Changed**: Refactoring, behavior changes (non-breaking)
- **Fixed**: Bug fixes, error handling
- **Removed**: Deprecated features (breaking)
- **Security**: Security fixes

Use bullet points, one per change. Be specific but concise.

### Documentation
List all documentation updates:
- CHANGELOG.md (root and package-level)
- README.md (root and package-specific)
- Architecture docs
- New documentation files
- AI skills

### Example Usage
Include practical examples:
- CLI commands with flags
- API usage
- Configuration examples
- Before/after comparisons

### Example Output
Show actual output when relevant:
- Command output
- API responses
- Visual changes
- Error messages

### Testing
Describe testing performed:
- Unit tests passing
- Integration tests
- Manual testing steps
- Edge cases tested

## Writing Style

### DO
- Use present tense: "Add hotspot command" not "Added hotspot command"
- Be specific: "Fix null pointer in X function" not "Fix bugs"
- Group related changes
- Include issue numbers: "Fix issue #123"
- Keep it concise

### DON'T
- Write novels - keep it scannable
- Include internal details not relevant to reviewers
- Use first person ("I added...")
- Mix past and present tense
- Include TODOs or placeholders

## Common Patterns

### New Feature PR
```markdown
## Summary
Add X feature to enable Y capability

## Changes
### Added
- Implement X feature
- Add configuration option Y

### Changed
- Update Z to support X

## Documentation
- Updated CHANGELOG.md
- Updated README.md with usage examples
- Added API documentation

## Example Usage
```bash
repostem new-command --option
```

## Testing
- Unit tests for X pass
- Manual testing with example usage
```

### Bug Fix PR
```markdown
## Summary
Fix X bug that caused Y error

## Changes
### Fixed
- Fix null pointer in X function
- Add error handling for edge case Y

## Testing
- Reproduced bug before fix
- Verified fix resolves issue
- Added regression test
```

### Refactoring PR
```markdown
## Summary
Refactor X to improve Y

## Changes
### Changed
- Extract X into separate module
- Simplify Y logic
- Improve type safety

### Fixed
- Fix type error in X

## Testing
- All existing tests pass
- No functional changes
```

### Documentation-Only PR
```markdown
## Summary
Update documentation for X feature

## Changes
### Changed
- Update README.md with new examples
- Add architecture diagram
- Fix typos in API docs

## Documentation
- Updated README.md
- Updated architecture docs
```

## Breaking Changes

If this PR contains breaking changes:

```markdown
## Breaking Changes
- **BREAKING**: Remove deprecated X option
- Migration guide: [link or instructions]
```

Include migration instructions when applicable.

## Issue References

Always reference related issues:
- Single issue: `Fixes #123`
- Multiple issues: `Fixes #123, #124, #125`
- Closes issue: `Closes #123`

Add at the end of PR description or in specific sections.

## Checklist Before Submitting

- [ ] Summary is clear and concise (1-2 sentences)
- [ ] Changes are grouped by category (Added/Changed/Fixed)
- [ ] Documentation section lists all updates
- [ ] Example usage is practical and tested
- [ ] Example output is accurate
- [ ] Testing section describes verification
- [ ] Breaking changes are clearly marked
- [ ] Issue numbers are referenced
- [ ] No internal details irrelevant to reviewers
- [ ] Uses present tense consistently

## PR Title Guidelines

Keep PR titles short and descriptive:
- Use present tense: "Add hotspot command" not "Added hotspot command"
- Start with verb: "Add", "Fix", "Refactor", "Update"
- Include scope if relevant: "cli: Add hotspot command"
- Max 50 characters if possible

Examples:
- ✅ "Add hotspot command"
- ✅ "Fix null pointer in risk engine"
- ✅ "Refactor dependency graph builder"
- ❌ "I added the hotspot command"
- ❌ "Fixed some bugs in the engine"
- ❌ "Updated documentation and fixed tests"

## When to Include Screenshots

Include screenshots when:
- UI changes are made
- Output format changes significantly
- Visual bugs are fixed
- Architecture diagrams are added

Use markdown image syntax:
```markdown
![Description](/path/to/image.png)
```

## Draft vs Ready

### Draft PR
Use when:
- Work in progress
- Need early feedback
- Not ready for review

Mark as `[Draft]` in title or use GitHub draft feature.

### Ready PR
Use when:
- Changes are complete
- Tests pass
- Documentation updated
- Ready for merge

Remove `[Draft]` and request review.

## Reviewer Tips

Help reviewers by:
- Providing context in summary
- Grouping related changes
- Including examples
- Explaining non-obvious decisions
- Linking to related issues or docs

## Example Complete PR

```markdown
## Summary
Add hotspot command to identify architectural hotspots with classification labels and color coding

## Changes
### Added
- Implement repostem hotspot command to identify architectural hotspots
- Add hotspot calculation service with configurable threshold
- Export classify utility and MetricClassification from engine

### Changed
- Enhance hotspot output with classification labels (Low/Medium/High) and color coding
- Update Hotspot interface to include file property

### Fixed
- Update all hotspot engine tests to reflect new Hotspot object structure
- Fix mock snapshots to include required SnapshotAggregate properties

## Documentation
- Updated root CHANGELOG.md with hotspot command and output enhancements
- Updated apps/cli/CHANGELOG.md with version 0.1.7 changes
- Updated packages/engine/CHANGELOG.md with version 0.1.7 changes
- Updated root README.md to include hotspot command
- Updated apps/cli/README.md with hotspot command documentation
- Added AI skill updating-documentation.md

## Example Usage
```bash
# Show current architectural hotspots
repostem hotspot

# Hotspots for a specific repository
repostem hotspot -r /path/to/repo

# JSON output for integration
repostem hotspot -o json
```

## Example Output
```
=== Architectural Hotspots (Current Snapshot) ===

1. src/agents/pi-embedded-runner/run/attempt.ts
   - Risk: Low (0.20)
   - Impact: 0.0%
   - Churn: High (1.00)
   - Hotspot Score: Low (0.25)
```

## Testing
All tests passing (21/21 in hotspot-engine.test.ts)
Manual testing with example repository successful

Fixes #123
```
