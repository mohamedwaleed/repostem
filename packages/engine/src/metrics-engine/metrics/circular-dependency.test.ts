import { describe, it, expect, beforeEach } from 'vitest';
import { CircularDependencyMetric } from './circular-dependency';
import IGraph from '../../dependency-graph/graph-implementations/graph-interface';
import { MetricContext, Cycle } from '../../types';

const createMockGraph = (cycles: Cycle[] = []): IGraph => ({
    addNode: () => {},
    addEdge: () => {},
    getInDegree: () => 0,
    getOutDegree: () => 0,
    detectCycles: () => cycles,
    getNodes: () => new Map(),
    getEdges: () => new Map(),
            getRepositoryRoot: () => "/test/repo",
            getRepositoryRoot: () => "/test/repo"
});

describe('CircularDependencyMetric', () => {
    let metric: CircularDependencyMetric;

    beforeEach(() => {
        metric = new CircularDependencyMetric();
    });

    it('should have correct key', () => {
        expect(metric.key).toBe('circularDependency');
    });

    describe('compute', () => {
        it('should return 0 when no cycles exist in graph', () => {
            const graph = createMockGraph([]);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should return 0 when cycles exist but file is not involved', () => {
            const cycles: Cycle[] = [
                { nodes: ['a.ts', 'b.ts', 'c.ts'] }
            ];
            const graph = createMockGraph(cycles);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should return 1 when file is involved in a cycle', () => {
            const cycles: Cycle[] = [
                { nodes: ['file.ts', 'b.ts', 'c.ts'] }
            ];
            const graph = createMockGraph(cycles);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(1);
        });

        it('should return 1 when file is involved in multiple cycles', () => {
            const cycles: Cycle[] = [
                { nodes: ['file.ts', 'b.ts'] },
                { nodes: ['file.ts', 'c.ts', 'd.ts'] }
            ];
            const graph = createMockGraph(cycles);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(1);
        });

        it('should return 1 for self-loop (file depends on itself)', () => {
            const cycles: Cycle[] = [
                { nodes: ['file.ts'] }
            ];
            const graph = createMockGraph(cycles);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(1);
        });

        it('should return 1 for simple 2-node cycle', () => {
            const cycles: Cycle[] = [
                { nodes: ['file.ts', 'other.ts'] }
            ];
            const graph = createMockGraph(cycles);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(1);
        });

        it('should return 1 for large cycle', () => {
            const cycles: Cycle[] = [
                { nodes: ['file.ts', 'a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts', 'f.ts'] }
            ];
            const graph = createMockGraph(cycles);
            const context: MetricContext = { totalFiles: 10, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(1);
        });

        it('should return 0 when multiple cycles exist but file not in any', () => {
            const cycles: Cycle[] = [
                { nodes: ['a.ts', 'b.ts'] },
                { nodes: ['c.ts', 'd.ts', 'e.ts'] },
                { nodes: ['x.ts', 'y.ts'] }
            ];
            const graph = createMockGraph(cycles);
            const context: MetricContext = { totalFiles: 10, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should handle empty cycles array', () => {
            const graph = createMockGraph([]);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should be case-sensitive when matching file paths', () => {
            const cycles: Cycle[] = [
                { nodes: ['File.ts', 'b.ts'] }
            ];
            const graph = createMockGraph(cycles);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should match exact file path in cycle', () => {
            const cycles: Cycle[] = [
                { nodes: ['src/file.ts', 'b.ts'] }
            ];
            const graph = createMockGraph(cycles);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'src/file.ts', context);
            expect(result).toBe(1);
        });

        it('should return 1 when file appears at different positions in cycle', () => {
            const cycles: Cycle[] = [
                { nodes: ['a.ts', 'file.ts', 'b.ts'] }
            ];
            const graph = createMockGraph(cycles);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile: new Map() };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(1);
        });
    });
});
