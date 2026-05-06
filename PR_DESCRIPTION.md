# Surface Absolute Transitive Dependent Growth in Drift Output

## Summary

Enhanced drift detection to show absolute transitive dependent counts in addition to impact ratios. Users can now see both the percentage change and the actual number of files affected when impact changes are detected.

## Changes

**Engine Layer:**
- Updated `detectImpactChanges` in `drift-engine.ts` to include absolute transitive dependent counts
- Added `previousTransitiveDependents`, `currentTransitiveDependents`, and `transitiveDependentsDelta` to `ImpactChangeItem` type
- Modified threshold logic to filter by both ratio change AND absolute count change

**CLI Layer:**
- Updated drift output to display transitive dependent counts alongside impact ratios
- Format: "Transitive Dependents: 50 → 120 (+70)"

## Example Output

**Before:**
```
Impact: 10.00% → 17.00% (+7.00%)
```

**After:**
```
Impact: 10.00% → 17.00% (+7.00%)
Transitive Dependents: 50 → 120 (+70)
```

## Benefits

- **Better context:** Users can see the actual magnitude of impact, not just percentages
- **Large repos:** A 1% change in a 10,000-file repo is more significant than 1% in a 100-file repo
- **Threshold flexibility:** Can filter by absolute count (e.g., "show me files that affect 50+ more files")

## Breaking Changes

None. This is an additive change that enhances existing drift output.
