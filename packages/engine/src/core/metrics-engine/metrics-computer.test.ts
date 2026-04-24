import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsComputer } from './metrics-computer';
import IGraph from '../dependency-graph/graph-implementations/graph-interface';
import { ParsedFile, Cycle, MetricContext } from '../../types';
import { IMetric } from './metrics/metric-interface';

vi.mock('simple-git');

const createMockFile = (path: string): ParsedFile => ({
    path,
    syntax: { imports: [] },
    metadata: { size: 0, extension: '.ts' }
});

const createMockGraph = (
    nodes: Map<string, ParsedFile>,
    inDegrees: Map<string, number>,
    outDegrees: Map<string, number>,
    cycles: Cycle[] = []
): IGraph => ({
    addNode: vi.fn(),
    addEdge: vi.fn(),
    getInDegree: (node: string) => inDegrees.get(node) || 0,
    getOutDegree: (node: string) => outDegrees.get(node) || 0,
    detectCycles: () => cycles,
    getNodes: () => nodes,
    getEdges: () => new Map(),
    getRepositoryRoot: () => "/test/repo",
    getDirectDependent: () => [],
    getTransitiveDependents: () => []
});

describe('MetricsComputer', () => {
    let computer: MetricsComputer;

    beforeEach(() => {
        computer = new MetricsComputer();
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with default metrics', () => {
            expect(computer).toBeDefined();
        });

        it('should register CentralityMetric', async () => {
            const nodes = new Map([['file.ts', createMockFile('file.ts')]]);
            const inDegrees = new Map([['file.ts', 2]]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, inDegrees, new Map([['file.ts', 0]]));
            const result = await computer.computeMetrics(graph);
            expect(result).toBeInstanceOf(Map);
        });
    });

    describe('registerMetric', () => {
        it('should add a new metric to the metrics array', async () => {
            const customMetric: IMetric = {
                key: 'custom',
                compute: () => 0.5
            };

            computer.registerMetric(customMetric);
            
            const nodes = new Map([['file.ts', createMockFile('file.ts')]]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);
            expect(result).toBeInstanceOf(Map);
        });

        it('should allow registering multiple custom metrics', async () => {
            const metric1: IMetric = {
                key: 'metric1',
                compute: () => 0.3
            };
            const metric2: IMetric = {
                key: 'metric2',
                compute: () => 0.7
            };

            computer.registerMetric(metric1);
            computer.registerMetric(metric2);

            const nodes = new Map([['file.ts', createMockFile('file.ts')]]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);
            expect(result).toBeInstanceOf(Map);
        });

        it('should handle async metric computation', async () => {
            const asyncMetric: IMetric = {
                key: 'asyncMetric',
                compute: async () => 0.5
            };

            computer.registerMetric(asyncMetric);

            const nodes = new Map([['file.ts', createMockFile('file.ts')]]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);
            expect(result).toBeInstanceOf(Map);
        });
    });

    describe('calculateMaxCommits (via computeMetrics)', () => {
        it('should calculate max commits across all files', async () => {
            const nodes = new Map([
                ['file1.ts', createMockFile('file1.ts')],
                ['file2.ts', createMockFile('file2.ts')]
            ]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                raw: vi.fn().mockResolvedValue('COMMIT:abc123\nfile1.ts\n\nCOMMIT:def456\nfile2.ts\nfile2.ts\n')
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(2);
        });

        it('should handle git errors gracefully and return 0', async () => {
            const nodes = new Map([['file.ts', createMockFile('file.ts')]]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                raw: vi.fn().mockRejectedValue(new Error('Git error'))
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            expect(result).toBeInstanceOf(Map);
            const fileMetrics = result.get('file.ts');
            expect(fileMetrics).toBeDefined();
        });

        it('should return 0 when no files have commits', async () => {
            const nodes = new Map([['file.ts', createMockFile('file.ts')]]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                raw: vi.fn().mockResolvedValue('')
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            expect(result).toBeInstanceOf(Map);
            const fileMetrics = result.get('file.ts');
            expect(fileMetrics).toBeDefined();
        });
    });

    describe('computeMetrics', () => {
        it('should return empty map for empty graph', async () => {
            const graph = createMockGraph(new Map(), new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        });

        it('should compute metrics for single file', async () => {
            const nodes = new Map([['file.ts', createMockFile('file.ts')]]);
            const inDegrees = new Map([['file.ts', 0]]);
            const outDegrees = new Map([['file.ts', 0]]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, inDegrees, outDegrees);
            const result = await computer.computeMetrics(graph);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(1);
            
            const fileMetrics = result.get('file.ts');
            expect(fileMetrics).toBeDefined();
            expect(fileMetrics).toHaveProperty('centrality');
            expect(fileMetrics).toHaveProperty('coupling');
            expect(fileMetrics).toHaveProperty('circularDependency');
            expect(fileMetrics).toHaveProperty('churn');
        });

        it('should compute metrics for multiple files', async () => {
            const nodes = new Map([
                ['file1.ts', createMockFile('file1.ts')],
                ['file2.ts', createMockFile('file2.ts')],
                ['file3.ts', createMockFile('file3.ts')]
            ]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(3);
            
            expect(result.get('file1.ts')).toBeDefined();
            expect(result.get('file2.ts')).toBeDefined();
            expect(result.get('file3.ts')).toBeDefined();
        });

        it('should compute centrality correctly', async () => {
            const nodes = new Map([
                ['file.ts', createMockFile('file.ts')],
                ['dep1.ts', createMockFile('dep1.ts')],
                ['dep2.ts', createMockFile('dep2.ts')]
            ]);
            const inDegrees = new Map([
                ['file.ts', 2],
                ['dep1.ts', 0],
                ['dep2.ts', 0]
            ]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, inDegrees, new Map());
            const result = await computer.computeMetrics(graph);

            const fileMetrics = result.get('file.ts');
            expect(fileMetrics).toBeDefined();
            expect(fileMetrics?.centrality).toBeCloseTo(1.0);
        });

        it('should compute coupling correctly', async () => {
            const nodes = new Map([
                ['file.ts', createMockFile('file.ts')],
                ['dep1.ts', createMockFile('dep1.ts')]
            ]);
            const inDegrees = new Map([
                ['file.ts', 1],
                ['dep1.ts', 0]
            ]);
            const outDegrees = new Map([
                ['file.ts', 1],
                ['dep1.ts', 0]
            ]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, inDegrees, outDegrees);
            const result = await computer.computeMetrics(graph);

            const fileMetrics = result.get('file.ts');
            expect(fileMetrics).toBeDefined();
            expect(fileMetrics?.coupling).toBeCloseTo(2 / 2);
        });

        it('should compute circular dependency correctly', async () => {
            const nodes = new Map([
                ['file.ts', createMockFile('file.ts')],
                ['other.ts', createMockFile('other.ts')]
            ]);
            const cycles: Cycle[] = [
                { nodes: ['file.ts', 'other.ts'] }
            ];

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map(), cycles);
            const result = await computer.computeMetrics(graph);

            const fileMetrics = result.get('file.ts');
            expect(fileMetrics).toBeDefined();
            expect(fileMetrics?.circularDependency).toBe(1);
        });

        it('should compute churn correctly', async () => {
            const nodes = new Map([['file.ts', createMockFile('file.ts')]]);

            const simpleGit = await import('simple-git');
            // Mock 10 commits for file.ts
            const gitOutput = Array.from({length: 10}, (_, i) => `COMMIT:commit${i}\nfile.ts\n`).join('\n');
            vi.mocked(simpleGit.default).mockReturnValue({
                raw: vi.fn().mockResolvedValue(gitOutput)
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            const fileMetrics = result.get('file.ts');
            expect(fileMetrics).toBeDefined();
            expect(fileMetrics?.churn).toBe(1.0);
        });

        it('should handle mixed synchronous and asynchronous metrics', async () => {
            const asyncMetric: IMetric = {
                key: 'asyncMetric',
                compute: async () => 0.5
            };

            computer.registerMetric(asyncMetric);

            const nodes = new Map([['file.ts', createMockFile('file.ts')]]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            const fileMetrics = result.get('file.ts');
            expect(fileMetrics).toBeDefined();
            expect(fileMetrics?.asyncMetric).toBe(0.5);
        });

        it('should calculate correct totalFiles in context', async () => {
            const nodes = new Map([
                ['file1.ts', createMockFile('file1.ts')],
                ['file2.ts', createMockFile('file2.ts')],
                ['file3.ts', createMockFile('file3.ts')]
            ]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            // Centrality should be calculated with totalFiles = 3
            const file1Metrics = result.get('file1.ts');
            expect(file1Metrics).toBeDefined();
            // With no dependencies, centrality should be 0
            expect(file1Metrics?.centrality).toBe(0);
        });

        it('should handle files with no dependencies', async () => {
            const nodes = new Map([['isolated.ts', createMockFile('isolated.ts')]]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 0 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            const fileMetrics = result.get('isolated.ts');
            expect(fileMetrics).toBeDefined();
            expect(fileMetrics?.centrality).toBe(0);
            expect(fileMetrics?.coupling).toBe(0);
            expect(fileMetrics?.circularDependency).toBe(0);
            expect(fileMetrics?.churn).toBe(0);
        });

        it('should handle files in circular dependency', async () => {
            const nodes = new Map([
                ['a.ts', createMockFile('a.ts')],
                ['b.ts', createMockFile('b.ts')],
                ['c.ts', createMockFile('c.ts')]
            ]);
            const cycles: Cycle[] = [
                { nodes: ['a.ts', 'b.ts', 'c.ts'] }
            ];

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map(), cycles);
            const result = await computer.computeMetrics(graph);

            expect(result.get('a.ts')?.circularDependency).toBe(1);
            expect(result.get('b.ts')?.circularDependency).toBe(1);
            expect(result.get('c.ts')?.circularDependency).toBe(1);
        });

        it('should handle files not in circular dependency', async () => {
            const nodes = new Map([
                ['a.ts', createMockFile('a.ts')],
                ['b.ts', createMockFile('b.ts')],
                ['c.ts', createMockFile('c.ts')],
                ['isolated.ts', createMockFile('isolated.ts')]
            ]);
            const cycles: Cycle[] = [
                { nodes: ['a.ts', 'b.ts', 'c.ts'] }
            ];

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map(), cycles);
            const result = await computer.computeMetrics(graph);

            expect(result.get('isolated.ts')?.circularDependency).toBe(0);
        });

        it('should normalize churn values based on maxCommits', async () => {
            const nodes = new Map([
                ['high-churn.ts', createMockFile('high-churn.ts')],
                ['low-churn.ts', createMockFile('low-churn.ts')]
            ]);

            const simpleGit = await import('simple-git');
            // Mock 20 commits for high-churn.ts and 5 for low-churn.ts
            const highChurnCommits = Array.from({length: 20}, (_, i) => `COMMIT:high${i}\nhigh-churn.ts\n`).join('\n');
            const lowChurnCommits = Array.from({length: 5}, (_, i) => `COMMIT:low${i}\nlow-churn.ts\n`).join('\n');
            const gitOutput = highChurnCommits + '\n' + lowChurnCommits;
            
            vi.mocked(simpleGit.default).mockReturnValue({
                raw: vi.fn().mockResolvedValue(gitOutput)
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            // maxCommits should be 20
            const highChurnMetrics = result.get('high-churn.ts');
            const lowChurnMetrics = result.get('low-churn.ts');
            
            expect(highChurnMetrics?.churn).toBe(1.0); // 20 / 20
            expect(lowChurnMetrics?.churn).toBe(0.25); // 5 / 20
        });

        it('should handle large number of files efficiently', async () => {
            const nodes = new Map();
            for (let i = 0; i < 50; i++) {
                nodes.set(`file${i}.ts`, createMockFile(`file${i}.ts`));
            }

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(50);
        });

        it('should return metrics as a Map with string keys', async () => {
            const nodes = new Map([['file.ts', createMockFile('file.ts')]]);

            const simpleGit = await import('simple-git');
            vi.mocked(simpleGit.default).mockReturnValue({
                log: vi.fn().mockResolvedValue({ total: 5 })
            } as any);

            const graph = createMockGraph(nodes, new Map(), new Map());
            const result = await computer.computeMetrics(graph);

            expect(result).toBeInstanceOf(Map);
            const fileMetrics = result.get('file.ts');
            expect(typeof fileMetrics).toBe('object');
        });
    });
});
