# @repostem/engine

## 0.2.0 - 2026-05-07

### Added

- Add ProgressEmitter class for event-based progress tracking
- Add progress events for file parsing, graph building, metrics, cycles, risk, persistence
- Add optional ProgressEmitter parameter to all application services
- Add absolute transitive dependent counts to ImpactChangeItem type
- Add hotspot calculation service with configurable threshold
- Add hotspot trend engine to compute trend scores from snapshot comparisons
- Add hotspot-trend-service to load snapshots and calculate hotspot trends
- Add drift-service to load snapshots and calculate drift
- Add HotspotTrendItem and HotspotTrendServiceOptions types
- Export classify utility and MetricClassification enum for CLI use
- Export calculateHotspotTrends service and related types
- Export ProgressEmitter, ProgressEvents, ProgressOptions, and emitProgress

### Changed

- Update drift detection to include previous/current/delta transitive dependent counts
- Update Hotspot type to include file property

## 0.1.6

### Patch Changes

- Fix path matcher bug

## 0.1.5

## 0.1.4

## 0.1.3

### Patch Changes

- create readmefile for engine
