import { describe, it, expect, beforeEach } from 'vitest';
import { CentralityMetric } from './centrality';
import IGraph from '../../dependency-graph/graph-implementations/graph-interface';
import { MetricContext, ParsedFile, Cycle } from '../../types';

const createMockGraph = (
    inDegrees: Map<string, number>
): IGraph => ({
    addNode: () => {},
    addEdge: () => {},
    getInDegree: (node: string) => inDegrees.get(node) || 0,
    getOutDegree: () => 0,
    detectCycles: () => [],
    getNodes: () => new Map(),
    getEdges: () => new Map()
});

describe('CentralityMetric', () => {
    let metric: CentralityMetric;

    beforeEach(() => {
        metric = new CentralityMetric();
    });

    it('should have correct key', () => {
        expect(metric.key).toBe('centrality');
    });

    describe('compute', () => {
        it('should return 0 for single file (totalFiles = 1)', () => {
            const graph = createMockGraph(new Map([['file.ts', 0]]));
            const context: MetricContext = { totalFiles: 1, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should return 0 when file has no incoming dependencies', () => {
            const graph = createMockGraph(new Map([['file.ts', 0]]));
            const context: MetricContext = { totalFiles: 5, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should calculate centrality correctly for file with 1 incoming dependency', () => {
            const graph = createMockGraph(new Map([['file.ts', 1]]));
            const context: MetricContext = { totalFiles: 5, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(1 / 4);
        });

        it('should calculate centrality correctly for file with multiple incoming dependencies', () => {
            const graph = createMockGraph(new Map([['file.ts', 3]]));
            const context: MetricContext = { totalFiles: 5, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(3 / 4);
        });

        it('should return 1.0 when all other files depend on target file', () => {
            const graph = createMockGraph(new Map([['file.ts', 9]]));
            const context: MetricContext = { totalFiles: 10, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(1.0);
        });

        it('should handle large number of files', () => {
            const graph = createMockGraph(new Map([['file.ts', 50]]));
            const context: MetricContext = { totalFiles: 100, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBeCloseTo(50 / 99);
        });

        it('should return 0 for totalFiles = 0 (edge case)', () => {
            const graph = createMockGraph(new Map([['file.ts', 5]]));
            const context: MetricContext = { totalFiles: 0, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });
    });
});
