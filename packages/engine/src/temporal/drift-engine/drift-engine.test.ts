import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectDrift } from './drift-engine';
import { SnapshotAggregate, FileMetrics, MetricClassification } from '../../types';
import { buildDependencyGraphFromSnapshot } from '../../core/dependency-graph/dependency-graph';
import { computeImpact } from '../../core/impact-engine/impact-engine';
import { computeHotspotScores } from '../../core/hostspot-engine/hostspot-engine';
import { calculateComplexityScore } from '../../repository-metrics/complexity-score';

// Mock external dependencies
vi.mock('../../core/dependency-graph/dependency-graph');
vi.mock('../../core/impact-engine/impact-engine');
vi.mock('../../core/hostspot-engine/hostspot-engine');
vi.mock('../../repository-metrics/complexity-score');

const createMockSnapshot = (
    files: Array<{ path: string; riskScore?: number; metrics?: FileMetrics }>,
    edges: Array<[string, string[]]>,
    cycles: Array<string[]> = [],
    metadata: { commitHash?: string | null; dirty?: boolean; createdAt?: Date } = {}
): SnapshotAggregate => {
    const filesMap = new Map<string, { path: string; metrics: FileMetrics; riskScore: number; riskLevel: MetricClassification }>();
    
    for (const file of files) {
        filesMap.set(file.path, {
            path: file.path,
            metrics: file.metrics ?? {
                centrality: 0,
                coupling: 0,
                churn: 0,
                circularDependency: 0
            },
            riskScore: file.riskScore ?? 0,
            riskLevel: MetricClassification.LOW
        });
    }

    const edgesMap = new Map<string, Set<string>>();
    for (const [from, toList] of edges) {
        edgesMap.set(from, new Set(toList));
    }

    return {
        repositoryRoot: '/test',
        metadata: {
            branch: null,
            commitHash: metadata.commitHash ?? null,
            dirty: metadata.dirty ?? false,
            createdAt: metadata.createdAt ?? new Date()
        },
        summary: {
            totalFiles: files.length,
            totalDependencies: edges.length,
            cycleCount: cycles.length
        },
        files: filesMap,
        edges: edgesMap,
        cycles: cycles.map(nodes => ({ nodes }))
    };
};

const createMockGraph = () => ({
    getNodes: () => new Map(),
    getEdges: () => new Map(),
    getTotalEdgeCount: () => 0,
    getNodesInCycles: () => new Set(),
    getAverageConnectivity: () => 0,
    addNode: vi.fn(),
    addEdge: vi.fn(),
    getInDegree: vi.fn(),
    getOutDegree: vi.fn(),
    detectCycles: vi.fn(),
    getRepositoryRoot: () => '/test',
    getDirectDependent: vi.fn(),
    getTransitiveDependents: vi.fn()
});

describe('DriftEngine - detectDrift', () => {
    let mockGraph1: ReturnType<typeof createMockGraph>;
    let mockGraph2: ReturnType<typeof createMockGraph>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockGraph1 = createMockGraph();
        mockGraph2 = createMockGraph();
        
        (buildDependencyGraphFromSnapshot as any).mockImplementation((snapshot: SnapshotAggregate) => {
            const nodes = new Map();
            for (const [path] of snapshot.files) {
                nodes.set(path, { path, syntax: {}, metadata: { size: 0, extension: '.ts' } });
            }
            return {
                ...mockGraph1,
                getNodes: () => nodes,
                getEdges: () => snapshot.edges
            };
        });
        
        (computeImpact as any).mockReturnValue({
            file: 'test.ts',
            directDependents: [],
            transitiveDependents: [],
            totalImpactCount: 0,
            impactRatio: 0
        });
        
        (computeHotspotScores as any).mockReturnValue(new Map());
        
        (calculateComplexityScore as any).mockReturnValue(0.5);
    });

    describe('detectDrift - Main Function', () => {
        it('should detect drift between two identical snapshots', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.5 }],
                [['file1.ts', ['file2.ts']]],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.5 }],
                [['file1.ts', ['file2.ts']]],
                []
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.previousSnapshot.commitHash).toBe(null);
            expect(result.currentSnapshot.commitHash).toBe(null);
            expect(result.riskChanges.items).toHaveLength(0);
            expect(result.impactChanges.items).toHaveLength(0);
        });

        it('should detect drift with default thresholds', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.1 }],
                [],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.2 }],
                [],
                []
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.riskChanges.items).toHaveLength(1); // delta 0.1 > threshold 0.05
        });

        it('should detect drift with custom thresholds', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.1 }],
                [],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.2 }],
                [],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.riskChanges.items).toHaveLength(1); // delta 0.1 > threshold 0.05
            expect(result.riskChanges.items[0].delta).toBe(0.1);
        });

        it('should create correct drift snapshot info', () => {
            const date1 = new Date('2024-01-01');
            const date2 = new Date('2024-01-02');
            
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts' }],
                [],
                [],
                { commitHash: 'abc123', dirty: false, createdAt: date1 }
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts' }],
                [],
                [],
                { commitHash: 'def456', dirty: true, createdAt: date2 }
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.previousSnapshot.commitHash).toBe('abc123');
            expect(result.previousSnapshot.dirty).toBe(false);
            expect(result.previousSnapshot.date).toBe(date1);
            expect(result.currentSnapshot.commitHash).toBe('def456');
            expect(result.currentSnapshot.dirty).toBe(true);
            expect(result.currentSnapshot.date).toBe(date2);
        });
    });

    describe('detectRiskChanges', () => {
        it('should detect increased risk', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.1 }],
                [],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.8 }],
                [],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.riskChanges.increasedCount).toBe(1);
            expect(result.riskChanges.decreasedCount).toBe(0);
            expect(result.riskChanges.items).toHaveLength(1);
            expect(result.riskChanges.items[0].file).toBe('file1.ts');
            expect(result.riskChanges.items[0].previousRisk).toBe(0.1);
            expect(result.riskChanges.items[0].currentRisk).toBe(0.8);
            expect(result.riskChanges.items[0].delta).toBeCloseTo(0.7, 10);
        });

        it('should detect decreased risk', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.8 }],
                [],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.1 }],
                [],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.riskChanges.increasedCount).toBe(0);
            expect(result.riskChanges.decreasedCount).toBe(1);
            expect(result.riskChanges.items[0].delta).toBeCloseTo(-0.7, 10);
        });

        it('should filter risk changes below threshold', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.1 }],
                [],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.12 }],
                [],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.riskChanges.items).toHaveLength(0);
        });

        it('should handle multiple files with mixed risk changes', () => {
            const snapshot1 = createMockSnapshot(
                [
                    { path: 'file1.ts', riskScore: 0.1 },
                    { path: 'file2.ts', riskScore: 0.8 },
                    { path: 'file3.ts', riskScore: 0.5 }
                ],
                [],
                []
            );
            const snapshot2 = createMockSnapshot(
                [
                    { path: 'file1.ts', riskScore: 0.7 },  // increased
                    { path: 'file2.ts', riskScore: 0.2 },  // decreased
                    { path: 'file3.ts', riskScore: 0.52 }  // below threshold
                ],
                [],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.riskChanges.items).toHaveLength(2);
            expect(result.riskChanges.increasedCount).toBe(1);
            expect(result.riskChanges.decreasedCount).toBe(1);
        });

        it('should skip files not in previous snapshot', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.1 }],
                [],
                []
            );
            const snapshot2 = createMockSnapshot(
                [
                    { path: 'file1.ts', riskScore: 0.8 },
                    { path: 'file2.ts', riskScore: 0.9 }  // new file
                ],
                [],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.riskChanges.items).toHaveLength(1);
            expect(result.riskChanges.items[0].file).toBe('file1.ts');
        });
    });

    describe('detectImpactChanges', () => {
        it('should detect increased impact', () => {
            (computeImpact as any)
                .mockReturnValueOnce({ file: 'file1.ts', impactRatio: 0.1, directDependents: [], transitiveDependents: [], totalImpactCount: 1 })
                .mockReturnValueOnce({ file: 'file1.ts', impactRatio: 0.8, directDependents: [], transitiveDependents: [], totalImpactCount: 8 });

            const snapshot1 = createMockSnapshot([{ path: 'file1.ts' }], []);
            const snapshot2 = createMockSnapshot([{ path: 'file1.ts' }], []);

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.impactChanges.increasedCount).toBe(1);
            expect(result.impactChanges.items).toHaveLength(1);
            expect(result.impactChanges.items[0].delta).toBeCloseTo(0.7, 10);
        });

        it('should filter impact changes below threshold', () => {
            (computeImpact as any)
                .mockReturnValueOnce({ file: 'file1.ts', impactRatio: 0.1, directDependents: [], transitiveDependents: [], totalImpactCount: 1 })
                .mockReturnValueOnce({ file: 'file1.ts', impactRatio: 0.12, directDependents: [], transitiveDependents: [], totalImpactCount: 2 });

            const snapshot1 = createMockSnapshot([{ path: 'file1.ts' }], []);
            const snapshot2 = createMockSnapshot([{ path: 'file1.ts' }], []);

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.impactChanges.items).toHaveLength(0);
        });

        it('should handle multiple files with impact changes', () => {
            (computeImpact as any)
                .mockReturnValueOnce({ file: 'file1.ts', impactRatio: 0.1, directDependents: [], transitiveDependents: [], totalImpactCount: 1 })
                .mockReturnValueOnce({ file: 'file2.ts', impactRatio: 0.2, directDependents: [], transitiveDependents: [], totalImpactCount: 2 })
                .mockReturnValueOnce({ file: 'file1.ts', impactRatio: 0.8, directDependents: [], transitiveDependents: [], totalImpactCount: 8 })
                .mockReturnValueOnce({ file: 'file2.ts', impactRatio: 0.9, directDependents: [], transitiveDependents: [], totalImpactCount: 9 });

            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.impactChanges.items).toHaveLength(2);
            expect(result.impactChanges.increasedCount).toBe(2);
        });
    });

    describe('detectDependencyChanges', () => {
        it('should detect new edges', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }],
                [['file1.ts', ['file2.ts']]]
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.dependencyChanges.newEdges).toBe(1);
            expect(result.dependencyChanges.removedEdges).toBe(0);
        });

        it('should detect removed edges', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }],
                [['file1.ts', ['file2.ts']]]
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }],
                []
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.dependencyChanges.newEdges).toBe(0);
            expect(result.dependencyChanges.removedEdges).toBe(1);
        });

        it('should detect both new and removed edges', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }, { path: 'file3.ts' }],
                [['file1.ts', ['file2.ts']]]
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }, { path: 'file3.ts' }],
                [['file1.ts', ['file3.ts']]]
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.dependencyChanges.newEdges).toBe(1);
            expect(result.dependencyChanges.removedEdges).toBe(1);
        });

        it('should handle multiple edges from same source', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }, { path: 'd.ts' }],
                [['a.ts', ['b.ts', 'c.ts']]]
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }, { path: 'd.ts' }],
                [['a.ts', ['b.ts', 'c.ts', 'd.ts']]]
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.dependencyChanges.newEdges).toBe(1);
            expect(result.dependencyChanges.removedEdges).toBe(0);
        });

        it('should handle completely new source nodes', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts' }],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }, { path: 'file3.ts' }],
                [['file1.ts', ['file2.ts', 'file3.ts']]]
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.dependencyChanges.newEdges).toBe(2);
        });

        it('should handle completely removed source nodes', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }, { path: 'file3.ts' }],
                [['file1.ts', ['file2.ts', 'file3.ts']]]
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts' }],
                []
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.dependencyChanges.removedEdges).toBe(2);
        });
    });

    describe('detectCycleChanges', () => {
        it('should detect new cycles', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }],
                [],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }],
                [],
                [['a.ts', 'b.ts']]
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.cycleChanges.newCycles).toHaveLength(1);
            expect(result.cycleChanges.newCycles[0].nodes).toEqual(['a.ts', 'b.ts']);
            expect(result.cycleChanges.resolvedCycles).toHaveLength(0);
        });

        it('should detect resolved cycles', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }],
                [],
                [['a.ts', 'b.ts']]
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }],
                [],
                []
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.cycleChanges.newCycles).toHaveLength(0);
            expect(result.cycleChanges.resolvedCycles).toHaveLength(1);
        });

        it('should detect both new and resolved cycles', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }, { path: 'd.ts' }],
                [],
                [['a.ts', 'b.ts']]
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }, { path: 'd.ts' }],
                [],
                [['c.ts', 'd.ts']]
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.cycleChanges.newCycles).toHaveLength(1);
            expect(result.cycleChanges.resolvedCycles).toHaveLength(1);
        });

        it('should handle multiple cycles', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }, { path: 'd.ts' }],
                [],
                [['a.ts', 'b.ts']]
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }, { path: 'd.ts' }],
                [],
                [['a.ts', 'b.ts'], ['c.ts', 'd.ts']]
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.cycleChanges.newCycles).toHaveLength(1);
            expect(result.cycleChanges.resolvedCycles).toHaveLength(0);
        });

        it('should identify same cycle regardless of node order', () => {
            const snapshot1 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }],
                [],
                [['a.ts', 'b.ts', 'c.ts']]
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }],
                [],
                [['c.ts', 'b.ts', 'a.ts']]  // Same cycle, different order
            );

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.cycleChanges.newCycles).toHaveLength(0);
            expect(result.cycleChanges.resolvedCycles).toHaveLength(0);
        });
    });

    describe('detectComplexityScoreChange', () => {
        it('should detect increased complexity', () => {
            (calculateComplexityScore as any)
                .mockReturnValueOnce(0.3)
                .mockReturnValueOnce(0.7);

            const snapshot1 = createMockSnapshot([{ path: 'file1.ts' }], []);
            const snapshot2 = createMockSnapshot([{ path: 'file1.ts' }], []);

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.complexityScoreChange.previousComplexityScore).toBe(0.3);
            expect(result.complexityScoreChange.currentComplexityScore).toBe(0.7);
            expect(result.complexityScoreChange.delta).toBeCloseTo(0.4, 10);
        });

        it('should detect decreased complexity', () => {
            (calculateComplexityScore as any)
                .mockReturnValueOnce(0.7)
                .mockReturnValueOnce(0.3);

            const snapshot1 = createMockSnapshot([{ path: 'file1.ts' }], []);
            const snapshot2 = createMockSnapshot([{ path: 'file1.ts' }], []);

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.complexityScoreChange.delta).toBeCloseTo(-0.4, 10);
        });

        it('should detect no complexity change', () => {
            (calculateComplexityScore as any)
                .mockReturnValueOnce(0.5)
                .mockReturnValueOnce(0.5);

            const snapshot1 = createMockSnapshot([{ path: 'file1.ts' }], []);
            const snapshot2 = createMockSnapshot([{ path: 'file1.ts' }], []);

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.complexityScoreChange.delta).toBe(0);
        });
    });

    describe('detectHotspotChanges', () => {
        it('should detect new hotspots', () => {
            (computeHotspotScores as any)
                .mockReturnValueOnce(new Map([['file1.ts', 0.2]]))
                .mockReturnValueOnce(new Map([['file1.ts', 0.8]]));

            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts', metrics: { centrality: 0.1, coupling: 0.1, churn: 0, circularDependency: 0, riskScore: 0.1 } }],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts', metrics: { centrality: 0.9, coupling: 0.9, churn: 0, circularDependency: 0, riskScore: 0.9 } }],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.hotspotChanges.newHotspots).toHaveLength(1);
            expect(result.hotspotChanges.newHotspots[0].file).toBe('file1.ts');
            expect(result.hotspotChanges.newHotspots[0].previousHotspotScore).toBe(0.2);
            expect(result.hotspotChanges.newHotspots[0].currentHotspotScore).toBe(0.8);
            expect(result.hotspotChanges.newHotspots[0].delta).toBeCloseTo(0.6, 10);
        });

        it('should detect resolved hotspots', () => {
            (computeHotspotScores as any)
                .mockReturnValueOnce(new Map([['file1.ts', 0.8]]))
                .mockReturnValueOnce(new Map([['file1.ts', 0.2]]));

            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts', metrics: { centrality: 0.9, coupling: 0.9, churn: 0, circularDependency: 0, riskScore: 0.9 } }],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts', metrics: { centrality: 0.1, coupling: 0.1, churn: 0, circularDependency: 0, riskScore: 0.1 } }],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.hotspotChanges.resolvedHotspots).toHaveLength(1);
            expect(result.hotspotChanges.resolvedHotspots[0].file).toBe('file1.ts');
            expect(result.hotspotChanges.resolvedHotspots[0].previousHotspotScore).toBe(0.8);
            expect(result.hotspotChanges.resolvedHotspots[0].currentHotspotScore).toBe(0.2);
            expect(result.hotspotChanges.resolvedHotspots[0].delta).toBeCloseTo(-0.6, 10);
        });

        it('should use custom hotspot threshold', () => {
            (computeHotspotScores as any)
                .mockReturnValueOnce(new Map([['file1.ts', 0.3]]))
                .mockReturnValueOnce(new Map([['file1.ts', 0.5]]));

            const snapshot1 = createMockSnapshot([{ path: 'file1.ts' }], []);
            const snapshot2 = createMockSnapshot([{ path: 'file1.ts' }], []);

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.4
            });

            expect(result.hotspotChanges.newHotspots).toHaveLength(1);
        });

        it('should handle files that remain hotspots', () => {
            (computeHotspotScores as any)
                .mockReturnValueOnce(new Map([['file1.ts', 0.8]]))
                .mockReturnValueOnce(new Map([['file1.ts', 0.9]]));

            const snapshot1 = createMockSnapshot([{ path: 'file1.ts' }], []);
            const snapshot2 = createMockSnapshot([{ path: 'file1.ts' }], []);

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.hotspotChanges.newHotspots).toHaveLength(0);
            expect(result.hotspotChanges.resolvedHotspots).toHaveLength(0);
        });

        it('should handle files that remain non-hotspots', () => {
            (computeHotspotScores as any)
                .mockReturnValueOnce(new Map([['file1.ts', 0.1]]))
                .mockReturnValueOnce(new Map([['file1.ts', 0.15]]));

            const snapshot1 = createMockSnapshot([{ path: 'file1.ts' }], []);
            const snapshot2 = createMockSnapshot([{ path: 'file1.ts' }], []);

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.hotspotChanges.newHotspots).toHaveLength(0);
            expect(result.hotspotChanges.resolvedHotspots).toHaveLength(0);
        });

        it('should handle new files in current snapshot', () => {
            (computeHotspotScores as any)
                .mockReturnValueOnce(new Map([]))
                .mockReturnValueOnce(new Map([['file2.ts', 0.8]]));

            const snapshot1 = createMockSnapshot([{ path: 'file1.ts' }], []);
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.hotspotChanges.newHotspots).toHaveLength(1);
            expect(result.hotspotChanges.newHotspots[0].file).toBe('file2.ts');
            expect(result.hotspotChanges.newHotspots[0].previousHotspotScore).toBe(0);
        });

        it('should handle removed files in current snapshot', () => {
            (computeHotspotScores as any)
                .mockReturnValueOnce(new Map([['file1.ts', 0.1], ['file2.ts', 0.8]]))
                .mockReturnValueOnce(new Map([['file1.ts', 0.1]]));

            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }],
                []
            );
            const snapshot2 = createMockSnapshot([{ path: 'file1.ts' }], []);

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.hotspotChanges.resolvedHotspots).toHaveLength(1);
            expect(result.hotspotChanges.resolvedHotspots[0].file).toBe('file2.ts');
            expect(result.hotspotChanges.resolvedHotspots[0].currentHotspotScore).toBe(0);
        });

        it('should handle multiple hotspot changes', () => {
            (computeHotspotScores as any)
                .mockReturnValueOnce(new Map([
                    ['file1.ts', 0.8],
                    ['file2.ts', 0.1],
                    ['file3.ts', 0.9]
                ]))
                .mockReturnValueOnce(new Map([
                    ['file1.ts', 0.2],
                    ['file2.ts', 0.9],
                    ['file3.ts', 0.85]
                ]));

            const snapshot1 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }, { path: 'file3.ts' }],
                []
            );
            const snapshot2 = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }, { path: 'file3.ts' }],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            expect(result.hotspotChanges.newHotspots).toHaveLength(1);
            expect(result.hotspotChanges.newHotspots[0].file).toBe('file2.ts');
            expect(result.hotspotChanges.resolvedHotspots).toHaveLength(1);
            expect(result.hotspotChanges.resolvedHotspots[0].file).toBe('file1.ts');
        });
    });

    describe('Integration Tests', () => {
        it('should detect comprehensive drift scenario', () => {
            (calculateComplexityScore as any)
                .mockReturnValueOnce(0.3)
                .mockReturnValueOnce(0.6);

            (computeImpact as any)
                .mockReturnValueOnce({ file: 'src/api.ts', impactRatio: 0.2, directDependents: [], transitiveDependents: [], totalImpactCount: 2 })
                .mockReturnValueOnce({ file: 'src/api.ts', impactRatio: 0.8, directDependents: [], transitiveDependents: [], totalImpactCount: 8 });

            (computeHotspotScores as any)
                .mockReturnValueOnce(new Map([
                    ['src/api.ts', 0.2],
                    ['src/utils.ts', 0.9]
                ]))
                .mockReturnValueOnce(new Map([
                    ['src/api.ts', 0.8],
                    ['src/utils.ts', 0.2]
                ]));

            const snapshot1 = createMockSnapshot(
                [
                    { path: 'src/api.ts', riskScore: 0.2 },
                    { path: 'src/utils.ts', riskScore: 0.9 },
                    { path: 'src/db.ts', riskScore: 0.5 }
                ],
                [['src/api.ts', ['src/utils.ts']]],
                [['src/utils.ts', 'src/db.ts']]
            );

            const snapshot2 = createMockSnapshot(
                [
                    { path: 'src/api.ts', riskScore: 0.9 },
                    { path: 'src/utils.ts', riskScore: 0.2 },
                    { path: 'src/db.ts', riskScore: 0.5 }
                ],
                [['src/api.ts', ['src/db.ts']]],
                []
            );

            const result = detectDrift(snapshot1, snapshot2, { 
                riskDelta: 0.05, 
                impactDeltaRatio: 0.05,
                hotspotThreshold: 0.25
            });

            // Risk changes
            expect(result.riskChanges.items).toHaveLength(2);
            expect(result.riskChanges.increasedCount).toBe(1);
            expect(result.riskChanges.decreasedCount).toBe(1);

            // Impact changes
            expect(result.impactChanges.items).toHaveLength(1);

            // Dependency changes
            expect(result.dependencyChanges.newEdges).toBe(1);
            expect(result.dependencyChanges.removedEdges).toBe(1);

            // Cycle changes
            expect(result.cycleChanges.resolvedCycles).toHaveLength(1);

            // Complexity changes
            expect(result.complexityScoreChange.delta).toBe(0.3);

            // Hotspot changes
            expect(result.hotspotChanges.newHotspots).toHaveLength(1);
            expect(result.hotspotChanges.resolvedHotspots).toHaveLength(1);
        });

        it('should handle empty snapshots', () => {
            const snapshot1 = createMockSnapshot([], [], []);
            const snapshot2 = createMockSnapshot([], [], []);

            const result = detectDrift(snapshot1, snapshot2);

            expect(result.riskChanges.items).toHaveLength(0);
            expect(result.impactChanges.items).toHaveLength(0);
            expect(result.dependencyChanges.newEdges).toBe(0);
            expect(result.dependencyChanges.removedEdges).toBe(0);
            expect(result.cycleChanges.newCycles).toHaveLength(0);
            expect(result.cycleChanges.resolvedCycles).toHaveLength(0);
            expect(result.hotspotChanges.newHotspots).toHaveLength(0);
            expect(result.hotspotChanges.resolvedHotspots).toHaveLength(0);
        });

        it('should handle identical snapshots', () => {
            (calculateComplexityScore as any).mockReturnValue(0.5);

            (computeImpact as any).mockReturnValue({ 
                file: 'file1.ts', 
                impactRatio: 0.5, 
                directDependents: [], 
                transitiveDependents: [], 
                totalImpactCount: 5 
            });

            (computeHotspotScores as any).mockReturnValue(new Map([['file1.ts', 0.5]]));

            const snapshot = createMockSnapshot(
                [{ path: 'file1.ts', riskScore: 0.5 }],
                [['file1.ts', ['file2.ts']]],
                []
            );

            const result = detectDrift(snapshot, snapshot);

            expect(result.riskChanges.items).toHaveLength(0);
            expect(result.impactChanges.items).toHaveLength(0);
            expect(result.dependencyChanges.newEdges).toBe(0);
            expect(result.dependencyChanges.removedEdges).toBe(0);
            expect(result.cycleChanges.newCycles).toHaveLength(0);
            expect(result.cycleChanges.resolvedCycles).toHaveLength(0);
            expect(result.complexityScoreChange.delta).toBe(0);
            expect(result.hotspotChanges.newHotspots).toHaveLength(0);
            expect(result.hotspotChanges.resolvedHotspots).toHaveLength(0);
        });
    });
});
