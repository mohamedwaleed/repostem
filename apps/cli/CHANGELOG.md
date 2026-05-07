# @repostem/cli

## 0.2.0 - 2026-05-07

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
- Implement repostem drift command for architectural drift detection (#25)
- Implement repostem history command (#19)
- Implement repostem hotspot command to identify architectural hotspots
- Implement repostem init command for snapshot persistence configuration (#12)
- Add hotspot trend analysis with --trend flag to track hotspot evolution over time
- Add --since, --branch, and --no-branch-filter options for hotspot trend analysis
- Extract reusable banner function for consistent CLI output across commands

### Changed

- Enhance hotspot output with classification labels (Low/Medium/High) and color coding
- Updated dependencies
  - @repostem/engine@0.2.0

### Fixed

- Fix impact delta calculation to correctly show increased/decreased counts

## 0.1.6

### Patch Changes

- Updated dependencies
  - @repostem/engine@0.1.6

## 0.1.5

### Patch Changes

- fix stale build
  - @repostem/engine@0.1.5

## 0.1.4

### Patch Changes

- write fixed values for cli main attributes
  - @repostem/engine@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies
  - @repostem/engine@0.1.3

## 0.1.2

### Patch Changes

- Fix packageJson import issue
