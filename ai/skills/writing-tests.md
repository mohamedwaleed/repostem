---
name: writing-tests
description: Guidelines for writing tests in the RepoStem project using Vitest. Use this skill when creating or modifying test files.
---

# Testing Guidelines for RepoStem

## Test Framework
- **Framework**: Vitest
- **Assertion**: Vitest's built-in `expect`
- **Mocking**: `vi.mock()` and `vi.fn()`

## File Organization
- Co-locate test files with source: `<source-file-name>.test.ts`
- Example: `analyze-service.ts` → `analyze-service.test.ts`

## Test Structure

### Naming Convention
- Describe blocks: `ServiceName - functionName` (e.g., `AnalyzeService - analyzeRepository`)
- Test names: `should <expected behavior>` (e.g., `should return metrics within valid ranges`)

### Organization Pattern
```typescript
describe('ServiceName - functionName', () => {
    describe('Feature Category', () => {
        it('should do something specific', async () => { /* test */ });
    });
    
    describe('Error Handling', () => {
        it('should throw error for invalid input', async () => { /* test */ });
    });
});
```

## Mocking Standards

### Module Mocking
Place all mocks at the top of the test file:
```typescript
vi.mock('../core/parser/parser', () => ({
    default: vi.fn(() => new Map([
        ['src/index.ts', new Set(['src/utils/helper.ts'])],
    ]))
}));
```

### State Reset
Use `beforeEach` for mutable state:
```typescript
const mockConfig = { storage_type: undefined as string | undefined };
beforeEach(() => { mockConfig.storage_type = undefined; });
```

### Conditional Mock Behavior
```typescript
vi.mock('../core/impact-engine/impact-engine', () => ({
    computeImpact: vi.fn((graph: any, filePath: string) => {
        if (filePath === 'src/non-existent.ts') {
            throw new Error(`File ${filePath} not found`);
        }
        return { file: filePath };
    })
}));
```

## Test Categories to Cover

Every service test file should include:
1. **Happy Path** - Basic functionality, expected structure, valid ranges
2. **Edge Cases** - Empty inputs, boundary values, missing optional fields
3. **Error Handling** - Invalid inputs throw appropriate errors, descriptive messages
4. **Integration Tests** - Multiple functions work together, end-to-end workflows
5. **Performance Tests** (when relevant) - Completes in reasonable time, concurrent operations

## Common Assertions

### Value Ranges (for 0.0-1.0 metrics)
```typescript
expect(result.centrality).toBeGreaterThanOrEqual(0);
expect(result.centrality).toBeLessThanOrEqual(1);
```

### Type Checks
```typescript
expect(typeof result.hasCircularDependency).toBe('boolean');
expect(Array.isArray(result.directDependents)).toBe(true);
```

### Error Assertions
```typescript
await expect(analyzeFileRisk(repoPath, 'non-existent.ts')).rejects.toThrow(/not found/i);
```

### Property Existence
```typescript
expect(result).toHaveProperty('centrality');
```

### Sorting Verification
```typescript
for (let i = 0; i < result.topRiskFiles.length - 1; i++) {
    expect(result.topRiskFiles[i].score).toBeGreaterThanOrEqual(result.topRiskFiles[i + 1].score);
}
```

## What to Test

### ✅ DO Test
- Public API functions
- Return value structure and types
- Value ranges and constraints
- Error conditions and messages
- Edge cases
- Integration between components
- Concurrent operations

### ❌ DON'T Test
- Private implementation details
- Third-party library behavior
- Trivial getters/setters
- Framework internals

## Test Independence
Each test must be independent - no shared state between tests.

## Running Tests
```bash
pnpm test                    # All tests
pnpm test:engine             # Engine package tests
pnpm vitest run <file>       # Specific file
pnpm vitest                  # Watch mode
```

## Checklist Before Submitting
- [ ] Test file co-located with source
- [ ] Describe blocks: `ServiceName - functionName`
- [ ] Test names: `should <expected behavior>`
- [ ] All mocks at top of file
- [ ] Mutable state reset in `beforeEach`
- [ ] Covers: happy path, edge cases, error handling
- [ ] Assertions are specific
- [ ] Tests are independent
- [ ] All tests pass: `pnpm test:cli , pnpm test:engine`
