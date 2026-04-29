---
name: updating-changelog
description: Guidelines for updating the CHANGELOG.md file when a GitHub issue or story is completed. Use this skill when marking issues as done or preparing for releases.
---

# Changelog Update Guidelines

## When to Update
Update `CHANGELOG.md` when:
- A GitHub issue or story is completed and merged
- A feature is implemented
- A bug fix is merged
- A breaking change is introduced
- Preparing for a release

## File Location
- Root-level `CHANGELOG.md` (not package-level changelogs)

## Format Standard
The project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

## Change Categories

### Added
- New features
- New CLI commands
- New configuration options
- New dependencies

### Changed
- Refactoring
- Behavior changes (non-breaking)
- Internal architecture changes
- Deprecation notices

### Fixed
- Bug fixes
- Error handling improvements
- Edge case fixes

### Removed
- Removed features (breaking)
- Deprecated functionality removed

### Security
- Security fixes
- Vulnerability patches

## Adding Entries

### For In-Progress Changes
Add to the `[Unreleased]` section at the top:

```markdown
## [Unreleased]

### Added
- Feature description (#issue-number)

### Changed
- Refactor description (#issue-number)
```

### Entry Format
- Use imperative mood: "Implement X" not "Implemented X"
- Include GitHub issue number in parentheses: `(#19)`
- One line per change
- Group by category
- Order: Added → Changed → Deprecated → Removed → Fixed → Security

## Example Entry

```markdown
## [Unreleased]

### Added
- Implement repostem history command (#19)
- Implement snapshot repository abstraction layer (#14)

### Changed
- Refactor metric responsibilities into structural, repository, and temporal layers (#24)

### Fixed
- Fix path matcher bug in engine (#25)
```

## Release Process

When releasing a version:
1. Rename `[Unreleased]` to `[VERSION]` (e.g., `[0.2.0]`)
2. Add release date: `[0.2.0] - 2025-04-29`
3. Create a new `[Unreleased]` section at the top
4. Update version numbers in package.json files

## What to Include

### ✅ DO Include
- User-visible changes
- Breaking changes
- Performance improvements
- Security fixes
- Configuration changes
- API changes

### ❌ DON'T Include
- Internal refactoring without user impact
- Test changes
- Documentation-only changes (unless significant)
- Dependency updates without functional changes
- Trivial fixes

## Issue Reference Format
- Always reference the GitHub issue number
- Format: `(#issue-number)`
- Example: `(#19)`, `(#24)`

## Multiple Issues
If one PR closes multiple issues, list all:
```markdown
- Implement feature X (#12, #13, #14)
```

## Breaking Changes
Mark breaking changes explicitly:
```markdown
### Changed
- **BREAKING**: Remove deprecated API endpoint (#20)
```

## Checklist Before Submitting
- [ ] Entry added to `[Unreleased]` section
- [ ] Category is correct (Added/Changed/Fixed/etc.)
- [ ] Uses imperative mood
- [ ] Includes issue number reference
- [ ] One line per change
- [ ] No internal-only changes listed
- [ ] Breaking changes marked with **BREAKING**
