import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChurnMetric } from './churn';
import IGraph from '../../dependency-graph/graph-implementations/graph-interface';
import { MetricContext } from '../../../types';

vi.mock('simple-git');

const createMockGraph = (): IGraph => ({
    addNode: () => {},
    addEdge: () => {},
    getInDegree: () => 0,
    getOutDegree: () => 0,
    detectCycles: () => [],
    getNodes: () => new Map(),
    getEdges: () => new Map(),
    getRepositoryRoot: () => "/test/repo"
});

describe('ChurnMetric', () => {
    let metric: ChurnMetric;

    beforeEach(() => {
        metric = new ChurnMetric();
        vi.clearAllMocks();
    });

    it('should have correct key', () => {
        expect(metric.key).toBe('churn');
    });

    describe('compute', () => {
        it('should return 0 when maxCommits is 0', async () => {
            const graph = createMockGraph();
            const commitsPerFile = new Map([['file.ts', 0]]);
            const context: MetricContext = { totalFiles: 5, maxCommits: 0, repositoryRoot: "/test/repo", commitsPerFile };

            const result = await metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should return 0 when file has no commits', async () => {
            const graph = createMockGraph();
            const commitsPerFile = new Map([['file.ts', 0]]);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile };

            const result = await metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should calculate churn correctly for file with commits', async () => {
            const graph = createMockGraph();
            const commitsPerFile = new Map([['file.ts', 5]]);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile };

            const result = await metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0.5);
        });

        it('should return 1.0 when file has maxCommits', async () => {
            const graph = createMockGraph();
            const commitsPerFile = new Map([['file.ts', 20]]);
            const context: MetricContext = { totalFiles: 5, maxCommits: 20, repositoryRoot: "/test/repo", commitsPerFile };

            const result = await metric.compute(graph, 'file.ts', context);
            expect(result).toBe(1.0);
        });

        it('should handle git errors gracefully and return 0', async () => {
            const graph = createMockGraph();
            const commitsPerFile = new Map(); // File not in map
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile };

            const result = await metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0);
        });

        it('should calculate churn for low activity file', async () => {
            const graph = createMockGraph();
            const commitsPerFile = new Map([['file.ts', 2]]);
            const context: MetricContext = { totalFiles: 5, maxCommits: 100, repositoryRoot: "/test/repo", commitsPerFile };

            const result = await metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0.02);
        });

        it('should calculate churn for high activity file', async () => {
            const graph = createMockGraph();
            const commitsPerFile = new Map([['file.ts', 45]]);
            const context: MetricContext = { totalFiles: 5, maxCommits: 50, repositoryRoot: "/test/repo", commitsPerFile };

            const result = await metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0.9);
        });

        it('should handle single commit', async () => {
            const graph = createMockGraph();
            const commitsPerFile = new Map([['file.ts', 1]]);
            const context: MetricContext = { totalFiles: 5, maxCommits: 10, repositoryRoot: "/test/repo", commitsPerFile };

            const result = await metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0.1);
        });

        it('should normalize correctly with varying maxCommits', async () => {
            const graph = createMockGraph();
            const commitsPerFile = new Map([['file.ts', 1]]);
            const context: MetricContext = { totalFiles: 5, maxCommits: 1, repositoryRoot: "/test/repo", commitsPerFile };

            const result = await metric.compute(graph, 'file.ts', context);
            expect(result).toBe(1.0);
        });

        it('should handle very large commit counts', async () => {
            const graph = createMockGraph();
            const commitsPerFile = new Map([['file.ts', 750]]);
            const context: MetricContext = { totalFiles: 5, maxCommits: 1000, repositoryRoot: "/test/repo", commitsPerFile };

            const result = await metric.compute(graph, 'file.ts', context);
            expect(result).toBe(0.75);
        });
    });
});
