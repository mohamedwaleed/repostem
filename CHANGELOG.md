# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Implement repostem drift command for architectural drift detection (#25)
- Implement repostem history command (#19)
- Implement snapshot repository abstraction layer (#14)
- Persist structural snapshot during repostem analyze (#13)
- Implement snapshot persistence configuration (repostem init + config loader) (#12)

### Changed
- Refactor metric responsibilities into structural, repository, and temporal layers (#24)
- Extract reusable banner function for consistent CLI output across commands
- Improve impact change filtering with dual threshold (ratio + absolute count)

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
