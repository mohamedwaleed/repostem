import { describe, it, expect, beforeEach } from 'vitest';
import { CouplingMetric } from './coupling';
import IGraph from '../../dependency-graph/graph-implementations/graph-interface';
import { MetricContext } from '../../types';

const createMockGraph = (
    inDegrees: Map<string, number>,
    outDegrees: Map<string, number>
): IGraph => ({
    addNode: () => {},
    addEdge: () => {},
    getInDegree: (node: string) => inDegrees.get(node) || 0,
    getOutDegree: (node: string) => outDegrees.get(node) || 0,
    detectCycles: () => [],
    getNodes: () => new Map(),
    getEdges: () => new Map()
});

describe('CouplingMetric', () => {
    let metric: CouplingMetric;

    beforeEach(() => {
        metric = new CouplingMetric();
    });

    it('should have correct key', () => {
        expect(metric.key).toBe('coupling');
    });

    describe('compute', () => {
        it('should return 0 for single file (totalFiles = 1)', () => {
            const graph = createMockGraph(
                new Map([['file.ts', 0]]),
                new Map([['file.ts', 0]])
            );
            const context: MetricContext = { totalFiles: 1, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should return 0 when file has no dependencies (isolated file)', () => {
            const graph = createMockGraph(
                new Map([['file.ts', 0]]),
                new Map([['file.ts', 0]])
            );
            const context: MetricContext = { totalFiles: 5, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should calculate coupling with only incoming dependencies', () => {
            const graph = createMockGraph(
                new Map([['file.ts', 2]]),
                new Map([['file.ts', 0]])
            );
            const context: MetricContext = { totalFiles: 5, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(2 / 8);
        });

        it('should calculate coupling with only outgoing dependencies', () => {
            const graph = createMockGraph(
                new Map([['file.ts', 0]]),
                new Map([['file.ts', 3]])
            );
            const context: MetricContext = { totalFiles: 5, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(3 / 8);
        });

        it('should calculate coupling with both incoming and outgoing dependencies', () => {
            const graph = createMockGraph(
                new Map([['file.ts', 2]]),
                new Map([['file.ts', 3]])
            );
            const context: MetricContext = { totalFiles: 5, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(5 / 8);
        });

        it('should return 1.0 for maximum coupling (all possible connections)', () => {
            const graph = createMockGraph(
                new Map([['file.ts', 9]]),
                new Map([['file.ts', 9]])
            );
            const context: MetricContext = { totalFiles: 10, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(1.0);
        });

        it('should handle asymmetric coupling (more in than out)', () => {
            const graph = createMockGraph(
                new Map([['file.ts', 7]]),
                new Map([['file.ts', 2]])
            );
            const context: MetricContext = { totalFiles: 10, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(9 / 18);
        });

        it('should handle asymmetric coupling (more out than in)', () => {
            const graph = createMockGraph(
                new Map([['file.ts', 1]]),
                new Map([['file.ts', 8]])
            );
            const context: MetricContext = { totalFiles: 10, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(9 / 18);
        });

        it('should handle large number of files', () => {
            const graph = createMockGraph(
                new Map([['file.ts', 25]]),
                new Map([['file.ts', 30]])
            );
            const context: MetricContext = { totalFiles: 100, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBeCloseTo(55 / 198);
        });

        it('should return 0 for totalFiles = 0 (edge case)', () => {
            const graph = createMockGraph(
                new Map([['file.ts', 5]]),
                new Map([['file.ts', 5]])
            );
            const context: MetricContext = { totalFiles: 0, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should handle equal in and out degrees', () => {
            const graph = createMockGraph(
                new Map([['file.ts', 4]]),
                new Map([['file.ts', 4]])
            );
            const context: MetricContext = { totalFiles: 10, maxCommits: 10 };

            const result = metric.compute(graph, 'file.ts', context);
            expect(result).toBeCloseTo(8 / 18);
        });
    });
});
