import { describe, it, expect, beforeEach, vi } from 'vitest';
import { computeHotspotScores } from './hostspot-engine';
import { FileMetrics, ParsedFile } from '../../types';
import IGraph from '../dependency-graph/graph-implementations/graph-interface';
import { computeImpact } from '../impact-engine/impact-engine';

// Mock the computeImpact function
vi.mock('../impact-engine/impact-engine');

// Mock dependency graph for testing
const createMockGraph = (): IGraph => {
    return {
        addNode: () => {},
        addEdge: () => {},
        getInDegree: () => 0,
        getOutDegree: () => 0,
        detectCycles: () => [],
        getNodes: () => new Map<string, ParsedFile>(),
        getEdges: () => new Map<string, Set<string>>(),
        getRepositoryRoot: () => '',
        getDirectDependent: () => [],
        getTransitiveDependents: () => [],
        getTotalEdgeCount: () => 0,
        getNodesInCycles: () => new Set<string>(),
        getAverageConnectivity: () => 0
    };
};

describe('HotspotEngine - computeHotspotScores', () => {
    let mockGraph: IGraph;

    beforeEach(() => {
        mockGraph = createMockGraph();
        vi.clearAllMocks();
    });

    describe('Happy Path', () => {
        it('should compute hotspot score for a single file with all zero metrics', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['file1.ts', {
                    centrality: 0,
                    coupling: 0,
                    churn: 0,
                    circularDependency: 0,
                    riskScore: 0,
                }],
            ]);

            // Mock computeImpact to return 0 impact
            (computeImpact as any).mockReturnValue({
                file: 'file1.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 0,
                impactRatio: 0
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);

            expect(result.size).toBe(1);
            expect(result.get('file1.ts')).toBe(0);
        });

        it('should compute hotspot score for a single file with all maximum metrics', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['file1.ts', {
                    centrality: 1,
                    coupling: 1,
                    churn: 1,
                    circularDependency: 1,
                    riskScore: 1,
                }],
            ]);

            // Mock computeImpact to return 1 impact
            (computeImpact as any).mockReturnValue({
                file: 'file1.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 1,
                impactRatio: 1
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);

            expect(result.size).toBe(1);
            // 1 * 0.5 + 1 * 0.3 + 1 * 0.15 + 0.05 = 1.0
            expect(result.get('file1.ts')).toBe(1);
        });

        it('should apply correct weights to metrics (0.5, 0.3, 0.15, 0.05)', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['file1.ts', {
                    centrality: 0,
                    coupling: 0,
                    churn: 0,
                    circularDependency: 0,
                    riskScore: 1,
                }],
            ]);

            (computeImpact as any).mockReturnValue({
                file: 'file1.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 0,
                impactRatio: 0
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            // riskScore * 0.5 = 1 * 0.5 = 0.5
            expect(result.get('file1.ts')).toBe(0.5);
        });

        it('should calculate weighted hotspot correctly for impactRatio only', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['file1.ts', {
                    centrality: 0,
                    coupling: 0,
                    churn: 0,
                    circularDependency: 0,
                    riskScore: 0,
                }],
            ]);

            (computeImpact as any).mockReturnValue({
                file: 'file1.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 1,
                impactRatio: 1
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            // impactRatio * 0.3 = 1 * 0.3 = 0.3
            expect(result.get('file1.ts')).toBe(0.3);
        });

        it('should calculate weighted hotspot correctly for churn only', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['file1.ts', {
                    centrality: 0,
                    coupling: 0,
                    churn: 1,
                    circularDependency: 0,
                    riskScore: 0,
                }],
            ]);

            (computeImpact as any).mockReturnValue({
                file: 'file1.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 0,
                impactRatio: 0
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            // churn * 0.15 = 1 * 0.15 = 0.15
            expect(result.get('file1.ts')).toBe(0.15);
        });

        it('should add cycle penalty when circularDependency is 1', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['file1.ts', {
                    centrality: 0,
                    coupling: 0,
                    churn: 0,
                    circularDependency: 1,
                    riskScore: 0,
                }],
            ]);

            (computeImpact as any).mockReturnValue({
                file: 'file1.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 0,
                impactRatio: 0
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            // circularDependency penalty = 0.05
            expect(result.get('file1.ts')).toBe(0.05);
        });

        it('should not add cycle penalty when circularDependency is 0', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['file1.ts', {
                    centrality: 0,
                    coupling: 0,
                    churn: 0,
                    circularDependency: 0,
                    riskScore: 0,
                }],
            ]);

            (computeImpact as any).mockReturnValue({
                file: 'file1.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 0,
                impactRatio: 0
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            expect(result.get('file1.ts')).toBe(0);
        });
    });

    describe('Multiple Files', () => {
        it('should compute hotspot scores for multiple files', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['file1.ts', {
                    centrality: 0.8,
                    coupling: 0.6,
                    churn: 0.4,
                    circularDependency: 0,
                    riskScore: 0.7,
                }],
                ['file2.ts', {
                    centrality: 0.2,
                    coupling: 0.3,
                    churn: 0.1,
                    circularDependency: 1,
                    riskScore: 0.3,
                }],
                ['file3.ts', {
                    centrality: 0,
                    coupling: 0,
                    churn: 0,
                    circularDependency: 0,
                    riskScore: 0,
                }],
            ]);

            const computeImpactMock = (computeImpact as any);
            computeImpactMock
                .mockReturnValueOnce({ file: 'file1.ts', directDependents: [], transitiveDependents: [], totalImpactCount: 5, impactRatio: 0.5 })
                .mockReturnValueOnce({ file: 'file2.ts', directDependents: [], transitiveDependents: [], totalImpactCount: 2, impactRatio: 0.2 })
                .mockReturnValueOnce({ file: 'file3.ts', directDependents: [], transitiveDependents: [], totalImpactCount: 0, impactRatio: 0 });

            const result = computeHotspotScores(fileMetrics, mockGraph);

            expect(result.size).toBe(3);
            
            // file1: 0.7 * 0.5 + 0.5 * 0.3 + 0.4 * 0.15 + 0 = 0.35 + 0.15 + 0.06 = 0.56
            expect(result.get('file1.ts')).toBeCloseTo(0.56, 10);
            
            // file2: 0.3 * 0.5 + 0.2 * 0.3 + 0.1 * 0.15 + 0.05 = 0.15 + 0.06 + 0.015 + 0.05 = 0.275
            expect(result.get('file2.ts')).toBeCloseTo(0.275, 10);
            
            // file3: all zeros
            expect(result.get('file3.ts')).toBe(0);
        });

        it('should maintain file order from input map', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['alpha.ts', { centrality: 0.1, coupling: 0.1, churn: 0.1, circularDependency: 0, riskScore: 0.1 }],
                ['beta.ts', { centrality: 0.2, coupling: 0.2, churn: 0.2, circularDependency: 0, riskScore: 0.2 }],
                ['gamma.ts', { centrality: 0.3, coupling: 0.3, churn: 0.3, circularDependency: 0, riskScore: 0.3 }],
            ]);

            const computeImpactMock = (computeImpact as any);
            computeImpactMock
                .mockReturnValueOnce({ file: 'alpha.ts', directDependents: [], transitiveDependents: [], totalImpactCount: 1, impactRatio: 0.1 })
                .mockReturnValueOnce({ file: 'beta.ts', directDependents: [], transitiveDependents: [], totalImpactCount: 2, impactRatio: 0.2 })
                .mockReturnValueOnce({ file: 'gamma.ts', directDependents: [], transitiveDependents: [], totalImpactCount: 3, impactRatio: 0.3 });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            const keys = Array.from(result.keys());
            
            expect(keys).toEqual(['alpha.ts', 'beta.ts', 'gamma.ts']);
        });
    });

    describe('Edge Cases', () => {
        it('should return empty map for empty input', () => {
            const fileMetrics = new Map<string, FileMetrics>();
            const result = computeHotspotScores(fileMetrics, mockGraph);
            expect(result.size).toBe(0);
        });

        it('should handle fractional metric values correctly', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['file1.ts', {
                    centrality: 0.5,
                    coupling: 0.5,
                    churn: 0.5,
                    circularDependency: 0.5,
                    riskScore: 0.5,
                }],
            ]);

            (computeImpact as any).mockReturnValue({
                file: 'file1.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 5,
                impactRatio: 0.5
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            // 0.5 * 0.5 + 0.5 * 0.3 + 0.5 * 0.15 + 0.05 = 0.25 + 0.15 + 0.075 + 0.05 = 0.525
            expect(result.get('file1.ts')).toBeCloseTo(0.525, 10);
        });

        it('should handle very small metric values', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['file1.ts', {
                    centrality: 0.0001,
                    coupling: 0.0002,
                    churn: 0.0003,
                    circularDependency: 0,
                    riskScore: 0.0001,
                }],
            ]);

            (computeImpact as any).mockReturnValue({
                file: 'file1.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 1,
                impactRatio: 0.0001
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            const expectedHotspot = 0.0001 * 0.5 + 0.0001 * 0.3 + 0.0003 * 0.15;
            expect(result.get('file1.ts')).toBeCloseTo(expectedHotspot, 10);
            expect(result.get('file1.ts')).toBeGreaterThan(0);
            expect(result.get('file1.ts')).toBeLessThan(0.001);
        });

        it('should handle values at boundaries (0 and 1)', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['boundary-file.ts', {
                    centrality: 1,
                    coupling: 0,
                    churn: 0,
                    circularDependency: 1,
                    riskScore: 1,
                }],
            ]);

            (computeImpact as any).mockReturnValue({
                file: 'boundary-file.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 0,
                impactRatio: 0
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            // 1 * 0.5 + 0 * 0.3 + 0 * 0.15 + 0.05 = 0.55
            expect(result.get('boundary-file.ts')).toBe(0.55);
        });

        it('should preserve metric precision in output', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['file1.ts', {
                    centrality: 0.123456789,
                    coupling: 0.987654321,
                    churn: 0.111111111,
                    circularDependency: 0.555555555,
                    riskScore: 0.777777777,
                }],
            ]);

            (computeImpact as any).mockReturnValue({
                file: 'file1.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 3,
                impactRatio: 0.333333333
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            const expectedHotspot = 0.777777777 * 0.5 + 0.333333333 * 0.3 + 0.111111111 * 0.15 + 0.05;
            expect(result.get('file1.ts')).toBeCloseTo(expectedHotspot, 10);
        });
    });

    describe('Realistic Scenarios', () => {
        it('should compute correct hotspot for realistic scenario', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['src/utils/helper.ts', {
                    centrality: 0.75,
                    coupling: 0.6,
                    churn: 0.3,
                    circularDependency: 0,
                    riskScore: 0.65,
                }],
                ['src/components/Button.tsx', {
                    centrality: 0.2,
                    coupling: 0.4,
                    churn: 0.8,
                    circularDependency: 0,
                    riskScore: 0.35,
                }],
                ['src/services/api.ts', {
                    centrality: 0.9,
                    coupling: 0.85,
                    churn: 0.5,
                    circularDependency: 1,
                    riskScore: 0.85,
                }],
            ]);

            const computeImpactMock = (computeImpact as any);
            computeImpactMock
                .mockReturnValueOnce({ file: 'src/utils/helper.ts', directDependents: [], transitiveDependents: [], totalImpactCount: 7, impactRatio: 0.7 })
                .mockReturnValueOnce({ file: 'src/components/Button.tsx', directDependents: [], transitiveDependents: [], totalImpactCount: 1, impactRatio: 0.15 })
                .mockReturnValueOnce({ file: 'src/services/api.ts', directDependents: [], transitiveDependents: [], totalImpactCount: 9, impactRatio: 0.9 });

            const result = computeHotspotScores(fileMetrics, mockGraph);

            expect(result.size).toBe(3);
            
            // helper.ts: 0.65 * 0.5 + 0.7 * 0.3 + 0.3 * 0.15 + 0 = 0.325 + 0.21 + 0.045 = 0.58
            expect(result.get('src/utils/helper.ts')).toBeCloseTo(0.58, 10);
            
            // Button.tsx: 0.35 * 0.5 + 0.15 * 0.3 + 0.8 * 0.15 + 0 = 0.175 + 0.045 + 0.12 = 0.34
            expect(result.get('src/components/Button.tsx')).toBeCloseTo(0.34, 10);
            
            // api.ts: 0.85 * 0.5 + 0.9 * 0.3 + 0.5 * 0.15 + 0.05 = 0.425 + 0.27 + 0.075 + 0.05 = 0.82
            expect(result.get('src/services/api.ts')).toBeCloseTo(0.82, 10);
            
            // Verify api.ts has highest hotspot score
            expect(result.get('src/services/api.ts')).toBeGreaterThan(result.get('src/utils/helper.ts')!);
            expect(result.get('src/services/api.ts')).toBeGreaterThan(result.get('src/components/Button.tsx')!);
        });

        it('should handle high-risk low-impact file', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['isolated-risk.ts', {
                    centrality: 0.9,
                    coupling: 0.8,
                    churn: 0.7,
                    circularDependency: 0,
                    riskScore: 0.9,
                }],
            ]);

            (computeImpact as any).mockReturnValue({
                file: 'isolated-risk.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 1,
                impactRatio: 0.1
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            // 0.9 * 0.5 + 0.1 * 0.3 + 0.7 * 0.15 + 0 = 0.45 + 0.03 + 0.105 = 0.585
            expect(result.get('isolated-risk.ts')).toBeCloseTo(0.585, 10);
        });

        it('should handle low-risk high-impact file', () => {
            const fileMetrics = new Map<string, FileMetrics>([
                ['stable-core.ts', {
                    centrality: 0.3,
                    coupling: 0.2,
                    churn: 0.1,
                    circularDependency: 0,
                    riskScore: 0.2,
                }],
            ]);

            (computeImpact as any).mockReturnValue({
                file: 'stable-core.ts',
                directDependents: [],
                transitiveDependents: [],
                totalImpactCount: 9,
                impactRatio: 0.9
            });

            const result = computeHotspotScores(fileMetrics, mockGraph);
            // 0.2 * 0.5 + 0.9 * 0.3 + 0.1 * 0.15 + 0 = 0.1 + 0.27 + 0.015 = 0.385
            expect(result.get('stable-core.ts')).toBeCloseTo(0.385, 10);
        });
    });

    describe('Weight Verification', () => {
        it('should verify weights sum to 1.0', () => {
            const weights = [0.5, 0.3, 0.15, 0.05];
            const sum = weights.reduce((a, b) => a + b, 0);
            expect(sum).toBe(1.0);
        });
    });
});
