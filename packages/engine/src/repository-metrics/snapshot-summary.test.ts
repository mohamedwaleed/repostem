import { describe, it, expect } from 'vitest';
import { buildSnapshotSummary } from './snapshot-summary';
import { SnapshotAggregate, MetricClassification } from '../types';

const createSnapshot = (overrides: Partial<SnapshotAggregate> = {}): SnapshotAggregate => ({
  repositoryRoot: '/test/repo',
  metadata: {
    branch: 'main',
    commitHash: 'abc123',
    dirty: false,
    createdAt: new Date('2024-01-01')
  },
  summary: {
    totalFiles: 0,
    totalDependencies: 0,
    cycleCount: 0
  },
  files: new Map(),
  edges: new Map(),
  cycles: [],
  ...overrides
});

const createFileSnapshot = (
  path: string,
  centrality: number,
  coupling: number,
  churn: number,
  circularDependency: number,
  riskScore: number,
  riskLevel: MetricClassification = MetricClassification.LOW
) => ({
  path,
  metrics: { centrality, coupling, churn, circularDependency },
  riskScore,
  riskLevel
});

describe('buildSnapshotSummary', () => {
  it('should return zeroed totals for empty snapshot', () => {
    const snapshot = createSnapshot();

    const result = buildSnapshotSummary(snapshot);

    expect(result.totalFiles).toBe(0);
    expect(result.totalDependencies).toBe(0);
    expect(result.cycleCount).toBe(0);
    expect(result.topCentralFiles).toEqual([]);
    expect(result.highChurnFiles).toEqual([]);
    expect(result.topRiskFiles).toEqual([]);
  });

  it('should compute total files and dependencies from snapshot', () => {
    const snapshot = createSnapshot({
      files: new Map([
        ['a.ts', createFileSnapshot('a.ts', 0, 0, 0, 0, 0)],
        ['b.ts', createFileSnapshot('b.ts', 0, 0, 0, 0, 0)]
      ]),
      edges: new Map([
        ['a.ts', new Set(['b.ts'])],
        ['b.ts', new Set(['a.ts'])]
      ]),
      cycles: [{ nodes: ['a.ts', 'b.ts'] }]
    });

    const result = buildSnapshotSummary(snapshot);

    expect(result.totalFiles).toBe(2);
    expect(result.totalDependencies).toBe(2);
    expect(result.cycleCount).toBe(1);
  });

  it('should rank top 5 files by centrality descending', () => {
    const snapshot = createSnapshot({
      files: new Map([
        ['low.ts', createFileSnapshot('low.ts', 0.1, 0, 0, 0, 0)],
        ['mid.ts', createFileSnapshot('mid.ts', 0.5, 0, 0, 0, 0)],
        ['high.ts', createFileSnapshot('high.ts', 0.9, 0, 0, 0, 0)]
      ])
    });

    const result = buildSnapshotSummary(snapshot);

    expect(result.topCentralFiles).toEqual([
      { file: 'high.ts', score: 0.9 },
      { file: 'mid.ts', score: 0.5 },
      { file: 'low.ts', score: 0.1 }
    ]);
  });

  it('should rank top 5 files by churn descending', () => {
    const snapshot = createSnapshot({
      files: new Map([
        ['stable.ts', createFileSnapshot('stable.ts', 0, 0, 0.05, 0, 0)],
        ['active.ts', createFileSnapshot('active.ts', 0, 0, 0.8, 0, 0)],
        ['hot.ts', createFileSnapshot('hot.ts', 0, 0, 1.0, 0, 0)]
      ])
    });

    const result = buildSnapshotSummary(snapshot);

    expect(result.highChurnFiles).toEqual([
      { file: 'hot.ts', score: 1.0 },
      { file: 'active.ts', score: 0.8 },
      { file: 'stable.ts', score: 0.05 }
    ]);
  });

  it('should rank top 5 files by riskScore descending', () => {
    const snapshot = createSnapshot({
      files: new Map([
        ['safe.ts', createFileSnapshot('safe.ts', 0, 0, 0, 0, 0.1)],
        ['risky.ts', createFileSnapshot('risky.ts', 0, 0, 0, 0, 0.6)],
        ['critical.ts', createFileSnapshot('critical.ts', 0, 0, 0, 0, 0.95)]
      ])
    });

    const result = buildSnapshotSummary(snapshot);

    expect(result.topRiskFiles).toEqual([
      { file: 'critical.ts', score: 0.95 },
      { file: 'risky.ts', score: 0.6 },
      { file: 'safe.ts', score: 0.1 }
    ]);
  });

  it('should cap rankings at 5 files', () => {
    const files = new Map<string, ReturnType<typeof createFileSnapshot>>();
    for (let i = 1; i <= 10; i++) {
      files.set(`file${i}.ts`, createFileSnapshot(`file${i}.ts`, i / 10, 0, i / 10, 0, i / 10));
    }

    const snapshot = createSnapshot({ files });

    const result = buildSnapshotSummary(snapshot);

    expect(result.topCentralFiles).toHaveLength(5);
    expect(result.highChurnFiles).toHaveLength(5);
    expect(result.topRiskFiles).toHaveLength(5);

    expect(result.topCentralFiles[0].file).toBe('file10.ts');
    expect(result.topCentralFiles[4].file).toBe('file6.ts');
  });

  it('should handle files with identical scores gracefully', () => {
    const snapshot = createSnapshot({
      files: new Map([
        ['a.ts', createFileSnapshot('a.ts', 0.5, 0, 0.5, 0, 0.5)],
        ['b.ts', createFileSnapshot('b.ts', 0.5, 0, 0.5, 0, 0.5)],
        ['c.ts', createFileSnapshot('c.ts', 0.5, 0, 0.5, 0, 0.5)]
      ])
    });

    const result = buildSnapshotSummary(snapshot);

    expect(result.topCentralFiles).toHaveLength(3);
    expect(result.topCentralFiles.every(f => f.score === 0.5)).toBe(true);
  });

  it('should include only files present in snapshot', () => {
    const snapshot = createSnapshot({
      files: new Map([
        ['single.ts', createFileSnapshot('single.ts', 0.7, 0.3, 0.5, 0, 0.4)]
      ]),
      edges: new Map(),
      cycles: []
    });

    const result = buildSnapshotSummary(snapshot);

    expect(result.totalFiles).toBe(1);
    expect(result.topCentralFiles).toEqual([{ file: 'single.ts', score: 0.7 }]);
    expect(result.highChurnFiles).toEqual([{ file: 'single.ts', score: 0.5 }]);
    expect(result.topRiskFiles).toEqual([{ file: 'single.ts', score: 0.4 }]);
  });
});
