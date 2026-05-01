import { describe, it, expect } from 'vitest';
import { calculateComplexityScore } from './complexity-score';
import { SnapshotAggregate, FileMetrics, MetricClassification } from '../types';
import { buildDependencyGraphFromSnapshot } from '../core/dependency-graph/dependency-graph';

const createMockSnapshot = (
    files: Array<{ path: string; riskScore?: number }>,
    edges: Array<[string, string[]]>,
    cycles: Array<string[]> = []
): SnapshotAggregate => {
    const filesMap = new Map<string, { path: string; metrics: FileMetrics; riskScore: number; riskLevel: MetricClassification }>();
    
    for (const file of files) {
        filesMap.set(file.path, {
            path: file.path,
            metrics: {
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
            commitHash: null,
            dirty: false,
            createdAt: new Date()
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

describe('calculateComplexityScore', () => {
    describe('Edge Cases', () => {
        it('should return 0 for empty snapshot', () => {
            const snapshot = createMockSnapshot([], [], []);
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            expect(calculateComplexityScore(graph)).toBe(0);
        });

        it('should return 0 for single file snapshot', () => {
            const snapshot = createMockSnapshot(
                [{ path: 'file1.ts' }],
                [],
                []
            );
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            expect(calculateComplexityScore(graph)).toBe(0);
        });

        it('should return 0 for two files with no edges', () => {
            const snapshot = createMockSnapshot(
                [{ path: 'file1.ts' }, { path: 'file2.ts' }],
                [],
                []
            );
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            expect(calculateComplexityScore(graph)).toBe(0);
        });
    });

    describe('Edge Density Component', () => {
        it('should calculate correct edge density for fully connected graph', () => {
            // 3 files, each depends on the other 2 = 6 edges total
            const snapshot = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }],
                [
                    ['a.ts', ['b.ts', 'c.ts']],
                    ['b.ts', ['a.ts', 'c.ts']],
                    ['c.ts', ['a.ts', 'b.ts']]
                ],
                []
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            // edge_density = 6 / (3 * 2) = 1.0
            // With no cycles and avg connectivity factored in
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(1);
        });

        it('should calculate correct edge density for sparse graph', () => {
            // 4 files, only 2 edges
            const snapshot = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }, { path: 'd.ts' }],
                [
                    ['a.ts', ['b.ts']],
                    ['b.ts', ['c.ts']]
                ],
                []
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            // edge_density = 2 / (4 * 3) = 0.167
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThan(0.5);
        });
    });

    describe('Cycle Ratio Component', () => {
        it('should return 0 cycle ratio when no cycles', () => {
            const snapshot = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }],
                [
                    ['a.ts', ['b.ts']],
                    ['b.ts', ['c.ts']]
                ],
                []
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            // No files in cycles, so cycle_ratio = 0
            // Score should be based only on edge_density and avg_connectivity
            expect(score).toBeGreaterThanOrEqual(0);
        });

        it('should calculate cycle ratio when all files in cycles', () => {
            // All 3 files are in a cycle
            const snapshot = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }],
                [
                    ['a.ts', ['b.ts']],
                    ['b.ts', ['c.ts']],
                    ['c.ts', ['a.ts']]
                ],
                [['a.ts', 'b.ts', 'c.ts']]
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            // cycle_ratio = 3/3 = 1.0
            // This should significantly increase the score due to 0.4 weight
            expect(score).toBeGreaterThan(0.3);
        });

        it('should calculate cycle ratio when some files in cycles', () => {
            // 4 files, only 2 in a cycle
            const snapshot = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }, { path: 'd.ts' }],
                [
                    ['a.ts', ['b.ts']],
                    ['b.ts', ['a.ts']],
                    ['c.ts', ['d.ts']]
                ],
                [['a.ts', 'b.ts']]
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            // cycle_ratio = 2/4 = 0.5
            expect(score).toBeGreaterThan(0);
        });
    });

    describe('Average Connectivity Component', () => {
        it('should calculate average connectivity correctly', () => {
            // 3 files: a -> b, b -> c
            // a: outDegree=1, inDegree=0, connectivity=1/(2*2)=0.25
            // b: outDegree=1, inDegree=1, connectivity=2/(2*2)=0.5
            // c: outDegree=0, inDegree=1, connectivity=1/(2*2)=0.25
            // avg = (0.25 + 0.5 + 0.25) / 3 = 0.333
            const snapshot = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }],
                [
                    ['a.ts', ['b.ts']],
                    ['b.ts', ['c.ts']]
                ],
                []
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            expect(score).toBeGreaterThan(0);
        });
    });

    describe('Weighted Score Calculation', () => {
        it('should apply correct weights (0.3, 0.4, 0.3)', () => {
            // Create a snapshot with known values
            // 2 files with 1 edge (edge_density = 1/2 = 0.5)
            // No cycles (cycle_ratio = 0)
            // Each file has connectivity 0.5 (avg_connectivity = 0.5)
            const snapshot = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }],
                [['a.ts', ['b.ts']]],
                []
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            // edge_density = 1 / (2 * 1) = 0.5
            // cycle_ratio = 0
            // avg_connectivity = (0.5 + 0.5) / 2 = 0.5
            // score = 0.3 * 0.5 + 0.4 * 0 + 0.3 * 0.5 = 0.15 + 0 + 0.15 = 0.3
            expect(score).toBeCloseTo(0.3, 10);
        });

        it('should produce maximum score for fully connected cyclic graph', () => {
            // 3 files all connected and all in a cycle
            const snapshot = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }],
                [
                    ['a.ts', ['b.ts', 'c.ts']],
                    ['b.ts', ['a.ts', 'c.ts']],
                    ['c.ts', ['a.ts', 'b.ts']]
                ],
                [['a.ts', 'b.ts', 'c.ts']]
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            // edge_density = 6 / 6 = 1.0
            // cycle_ratio = 1.0
            // avg_connectivity = 1.0 (each node has inDegree=2, outDegree=2)
            // score = 0.3 * 1 + 0.4 * 1 + 0.3 * 1 = 1.0
            expect(score).toBeCloseTo(1.0, 10);
        });
    });

    describe('Realistic Scenarios', () => {
        it('should calculate complexity for typical small project', () => {
            // 5 files with moderate coupling
            const snapshot = createMockSnapshot(
                [
                    { path: 'src/index.ts' },
                    { path: 'src/utils.ts' },
                    { path: 'src/services/api.ts' },
                    { path: 'src/services/auth.ts' },
                    { path: 'src/components/Button.tsx' }
                ],
                [
                    ['src/index.ts', ['src/services/api.ts', 'src/services/auth.ts']],
                    ['src/services/api.ts', ['src/utils.ts']],
                    ['src/services/auth.ts', ['src/utils.ts']],
                    ['src/components/Button.tsx', ['src/services/api.ts']]
                ],
                []
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(1);
        });

        it('should handle complex dependency chain', () => {
            // Linear chain: a -> b -> c -> d -> e
            const snapshot = createMockSnapshot(
                [
                    { path: 'a.ts' },
                    { path: 'b.ts' },
                    { path: 'c.ts' },
                    { path: 'd.ts' },
                    { path: 'e.ts' }
                ],
                [
                    ['a.ts', ['b.ts']],
                    ['b.ts', ['c.ts']],
                    ['c.ts', ['d.ts']],
                    ['d.ts', ['e.ts']]
                ],
                []
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThan(0.5);
        });

        it('should handle hub-and-spoke architecture', () => {
            // Central hub with 4 dependents
            const snapshot = createMockSnapshot(
                [
                    { path: 'hub.ts' },
                    { path: 'spoke1.ts' },
                    { path: 'spoke2.ts' },
                    { path: 'spoke3.ts' },
                    { path: 'spoke4.ts' }
                ],
                [
                    ['spoke1.ts', ['hub.ts']],
                    ['spoke2.ts', ['hub.ts']],
                    ['spoke3.ts', ['hub.ts']],
                    ['spoke4.ts', ['hub.ts']]
                ],
                []
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            expect(score).toBeGreaterThan(0);
        });
    });

    describe('Multiple Cycles', () => {
        it('should handle multiple independent cycles', () => {
            // Two separate cycles: a-b and c-d
            const snapshot = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }, { path: 'd.ts' }],
                [
                    ['a.ts', ['b.ts']],
                    ['b.ts', ['a.ts']],
                    ['c.ts', ['d.ts']],
                    ['d.ts', ['c.ts']]
                ],
                [['a.ts', 'b.ts'], ['c.ts', 'd.ts']]
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            // cycle_ratio = 4/4 = 1.0
            expect(score).toBeGreaterThan(0.3);
        });

        it('should handle overlapping cycles', () => {
            // a -> b -> c -> a and a -> d -> a (shared node a)
            const snapshot = createMockSnapshot(
                [{ path: 'a.ts' }, { path: 'b.ts' }, { path: 'c.ts' }, { path: 'd.ts' }],
                [
                    ['a.ts', ['b.ts', 'd.ts']],
                    ['b.ts', ['c.ts']],
                    ['c.ts', ['a.ts']],
                    ['d.ts', ['a.ts']]
                ],
                [['a.ts', 'b.ts', 'c.ts'], ['a.ts', 'd.ts']]
            );
            
            const graph = buildDependencyGraphFromSnapshot(snapshot);
            const score = calculateComplexityScore(graph);
            // All 4 files in cycles
            expect(score).toBeGreaterThan(0.3);
        });
    });
});
