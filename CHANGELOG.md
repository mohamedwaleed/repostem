# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-05-07

### Added
- Add real-time event-based progress indicators for all CLI commands (#34)
  - Progress bars for file parsing with actual percentages and file counts
  - Spinners for indeterminate operations (graph building, metrics, cycles, risk)
  - Immediate feedback with discovery spinner before parsing
  - Auto-disabled for JSON output mode
  - Graceful degradation in non-TTY/CI environments
- Add absolute transitive dependent counts to drift output
  - Show actual number of files affected alongside impact ratios
  - Display previous/current/delta transitive dependent counts
  - Filter by both ratio change AND absolute count change
- Add hotspot trend analysis with --trend flag to track hotspot evolution over time
- Add --since, --branch, and --no-branch-filter options for hotspot trend analysis
- Implement repostem drift command for architectural drift detection (#25)
- Implement repostem history command (#19)
- Implement repostem hotspot command to identify architectural hotspots
- Implement snapshot repository abstraction layer (#14)
- Persist structural snapshot during repostem analyze (#13)
- Implement snapshot persistence configuration (repostem init + config loader) (#12)

### Changed
- Refactor metric responsibilities into structural, repository, and temporal layers (#24)
- Extract reusable banner function for consistent CLI output across commands
- Improve impact change filtering with dual threshold (ratio + absolute count)
- Enhance hotspot output with classification labels (Low/Medium/High) and color coding

### Fixed
- Fix impact delta calculation to correctly show increased/decreased counts

## [0.1.6]

### Fixed
- Fix path matcher bug in engine

## [0.1.5]

### Fixed
- Fix stale build

## [0.1.4]

### Fixed
- Write fixed values for CLI main attributes

## [0.1.3]

### Added
- Create README file for engine

## [0.1.2]

### Fixed
- Fix package.json import issue

## [0.1.1]

### Patch
- Initial release changes

## [0.1.0]

### Added
- Initial release of RepoStem
- Tree-sitter-based AST parsing for JavaScript/TypeScript
- Dependency graph construction at file level
- Metrics engine: centrality, coupling, churn, circular dependency detection
- Risk scoring with weighted formula
- AI explanation layer using OpenAI API
- CLI interface for repository analysis
