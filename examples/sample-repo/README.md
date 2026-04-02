# Sample Repository for RepoStem Testing

This is a sample TypeScript repository designed to test RepoStem's structural risk analysis capabilities.

## Structure

```
src/
├── app.ts                      # Main application entry (high centrality)
├── index.ts                    # Bootstrap file
├── controllers/
│   └── user-controller.ts      # HTTP-like controller layer
├── services/
│   ├── user-service.ts         # Business logic layer
│   ├── database-service.ts     # Data persistence (circular with cache-service)
│   └── cache-service.ts        # Caching layer (circular with database-service)
├── models/
│   └── user.ts                 # Data model
└── utils/
    ├── logger.ts               # Logging utility (HIGH CENTRALITY - used everywhere)
    └── validator.ts            # Validation utility
```

## Test Scenarios

### 1. **High Centrality**
- `utils/logger.ts` is imported by almost every file
- Should score high on centrality metric
- Represents a critical dependency point

### 2. **Circular Dependencies**
- `database-service.ts` imports `cache-service.ts`
- `cache-service.ts` imports `database-service.ts` (commented out to avoid runtime errors, but shows the pattern)
- Should be detected by circular dependency analysis

### 3. **High Coupling**
- `app.ts` depends on multiple services and controllers
- `user-controller.ts` orchestrates multiple layers
- Should score high on coupling metric

### 4. **Layered Architecture**
- Controllers → Services → Models → Utils
- Clean dependency flow (except for the circular dependency example)

## Expected Analysis Results

When running RepoStem on this repository:

1. **logger.ts** should have:
   - Very high centrality (imported by 7+ files)
   - High risk score due to being a critical dependency

2. **database-service.ts** and **cache-service.ts** should:
   - Show circular dependency warning
   - Moderate to high coupling scores

3. **app.ts** should:
   - High coupling (depends on many modules)
   - Moderate centrality (entry point)

4. **user.ts**, **validator.ts** should:
   - Lower risk scores
   - Moderate coupling

## Usage

To test RepoStem with this sample repository:

```bash
# From the RepoStem root directory
pnpm run cli analyze ./examples/sample-repo
```

This will analyze the dependency graph, compute metrics, and generate risk scores for each file.
