import { describe, it, expect } from 'vitest';
import { computeRisk } from './risk-engine';

describe('Risk Engine', () => {
    describe('computeRisk', () => {
        it('should compute risk for a single file with all zero metrics', () => {
            const fileMetrics = new Map([
                ['file1.ts', {
                    centrality: 0,
                    coupling: 0,
                    circularDependency: 0,
                    churn: 0,
                }],
            ]);

            const result = computeRisk(fileMetrics);

            expect(result).toHaveLength(1);
            expect(result[0].risk).toBe(0);
            expect(result[0].metrics).toEqual({
                centrality: 0,
                coupling: 0,
                circularDependency: 0,
                churn: 0,
            });
        });

        it('should compute risk for a single file with all maximum metrics', () => {
            const fileMetrics = new Map([
                ['file1.ts', {
                    centrality: 1,
                    coupling: 1,
                    circularDependency: 1,
                    churn: 1,
                }],
            ]);

            const result = computeRisk(fileMetrics);

            expect(result).toHaveLength(1);
            expect(result[0].risk).toBe(1);
            expect(result[0].metrics).toEqual({
                centrality: 1,
                coupling: 1,
                circularDependency: 1,
                churn: 1,
            });
        });

        it('should apply correct weights to metrics (0.3, 0.25, 0.25, 0.2)', () => {
            const fileMetrics = new Map([
                ['file1.ts', {
                    centrality: 1,
                    coupling: 0,
                    circularDependency: 0,
                    churn: 0,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            expect(result[0].risk).toBe(0.3);
        });

        it('should calculate weighted risk correctly for coupling only', () => {
            const fileMetrics = new Map([
                ['file1.ts', {
                    centrality: 0,
                    coupling: 1,
                    circularDependency: 0,
                    churn: 0,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            expect(result[0].risk).toBe(0.25);
        });

        it('should calculate weighted risk correctly for circular dependency only', () => {
            const fileMetrics = new Map([
                ['file1.ts', {
                    centrality: 0,
                    coupling: 0,
                    circularDependency: 1,
                    churn: 0,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            expect(result[0].risk).toBe(0.25);
        });

        it('should calculate weighted risk correctly for churn only', () => {
            const fileMetrics = new Map([
                ['file1.ts', {
                    centrality: 0,
                    coupling: 0,
                    circularDependency: 0,
                    churn: 1,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            expect(result[0].risk).toBe(0.2);
        });

        it('should compute risk for multiple files', () => {
            const fileMetrics = new Map([
                ['file1.ts', {
                    centrality: 0.8,
                    coupling: 0.6,
                    circularDependency: 0,
                    churn: 0.4,
                }],
                ['file2.ts', {
                    centrality: 0.2,
                    coupling: 0.3,
                    circularDependency: 1,
                    churn: 0.1,
                }],
                ['file3.ts', {
                    centrality: 0,
                    coupling: 0,
                    circularDependency: 0,
                    churn: 0,
                }],
            ]);

            const result = computeRisk(fileMetrics);

            expect(result).toHaveLength(3);
            
            const file1Risk = 0.3 * 0.8 + 0.25 * 0.6 + 0.25 * 0 + 0.2 * 0.4;
            expect(result[0].risk).toBeCloseTo(file1Risk, 10);
            expect(result[0].metrics).toEqual(fileMetrics.get('file1.ts'));

            const file2Risk = 0.3 * 0.2 + 0.25 * 0.3 + 0.25 * 1 + 0.2 * 0.1;
            expect(result[1].risk).toBeCloseTo(file2Risk, 10);
            expect(result[1].metrics).toEqual(fileMetrics.get('file2.ts'));

            expect(result[2].risk).toBe(0);
            expect(result[2].metrics).toEqual(fileMetrics.get('file3.ts'));
        });

        it('should handle fractional metric values correctly', () => {
            const fileMetrics = new Map([
                ['file1.ts', {
                    centrality: 0.5,
                    coupling: 0.5,
                    circularDependency: 0.5,
                    churn: 0.5,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            const expectedRisk = 0.3 * 0.5 + 0.25 * 0.5 + 0.25 * 0.5 + 0.2 * 0.5;
            expect(result[0].risk).toBeCloseTo(expectedRisk, 10);
            expect(result[0].risk).toBe(0.5);
        });

        it('should preserve metric precision in output', () => {
            const fileMetrics = new Map([
                ['file1.ts', {
                    centrality: 0.123456789,
                    coupling: 0.987654321,
                    circularDependency: 0.555555555,
                    churn: 0.111111111,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            
            expect(result[0].metrics.centrality).toBe(0.123456789);
            expect(result[0].metrics.coupling).toBe(0.987654321);
            expect(result[0].metrics.circularDependency).toBe(0.555555555);
            expect(result[0].metrics.churn).toBe(0.111111111);
        });

        it('should return empty array for empty input', () => {
            const fileMetrics = new Map();
            const result = computeRisk(fileMetrics);
            expect(result).toEqual([]);
        });

        it('should handle files with high centrality and low other metrics', () => {
            const fileMetrics = new Map([
                ['central-file.ts', {
                    centrality: 1,
                    coupling: 0.1,
                    circularDependency: 0,
                    churn: 0.05,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            const expectedRisk = 0.3 * 1 + 0.25 * 0.1 + 0.25 * 0 + 0.2 * 0.05;
            expect(result[0].risk).toBeCloseTo(expectedRisk, 10);
        });

        it('should handle files with high churn but low structural metrics', () => {
            const fileMetrics = new Map([
                ['volatile-file.ts', {
                    centrality: 0.1,
                    coupling: 0.1,
                    circularDependency: 0,
                    churn: 1,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            const expectedRisk = 0.3 * 0.1 + 0.25 * 0.1 + 0.25 * 0 + 0.2 * 1;
            expect(result[0].risk).toBeCloseTo(expectedRisk, 10);
        });

        it('should handle files in circular dependencies with moderate other metrics', () => {
            const fileMetrics = new Map([
                ['circular-file.ts', {
                    centrality: 0.5,
                    coupling: 0.6,
                    circularDependency: 1,
                    churn: 0.3,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            const expectedRisk = 0.3 * 0.5 + 0.25 * 0.6 + 0.25 * 1 + 0.2 * 0.3;
            expect(result[0].risk).toBeCloseTo(expectedRisk, 10);
        });

        it('should maintain file order from input map', () => {
            const fileMetrics = new Map([
                ['alpha.ts', { centrality: 0.1, coupling: 0.1, circularDependency: 0, churn: 0.1 }],
                ['beta.ts', { centrality: 0.2, coupling: 0.2, circularDependency: 0, churn: 0.2 }],
                ['gamma.ts', { centrality: 0.3, coupling: 0.3, circularDependency: 0, churn: 0.3 }],
            ]);

            const result = computeRisk(fileMetrics);
            
            expect(result).toHaveLength(3);
            expect(result[0].metrics).toEqual(fileMetrics.get('alpha.ts'));
            expect(result[1].metrics).toEqual(fileMetrics.get('beta.ts'));
            expect(result[2].metrics).toEqual(fileMetrics.get('gamma.ts'));
        });

        it('should handle additional metrics beyond the four weighted ones', () => {
            const fileMetrics = new Map([
                ['file1.ts', {
                    centrality: 0.5,
                    coupling: 0.5,
                    circularDependency: 0.5,
                    churn: 0.5,
                    extraMetric: 0.9,
                    anotherMetric: 1.0,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            
            const expectedRisk = 0.3 * 0.5 + 0.25 * 0.5 + 0.25 * 0.5 + 0.2 * 0.5;
            expect(result[0].risk).toBeCloseTo(expectedRisk, 10);
            expect(result[0].metrics.extraMetric).toBe(0.9);
            expect(result[0].metrics.anotherMetric).toBe(1.0);
        });

        it('should compute correct risk for realistic scenario', () => {
            const fileMetrics = new Map([
                ['src/utils/helper.ts', {
                    centrality: 0.75,
                    coupling: 0.6,
                    circularDependency: 0,
                    churn: 0.3,
                }],
                ['src/components/Button.tsx', {
                    centrality: 0.2,
                    coupling: 0.4,
                    circularDependency: 0,
                    churn: 0.8,
                }],
                ['src/services/api.ts', {
                    centrality: 0.9,
                    coupling: 0.85,
                    circularDependency: 1,
                    churn: 0.5,
                }],
            ]);

            const result = computeRisk(fileMetrics);

            expect(result).toHaveLength(3);
            
            const helperRisk = 0.3 * 0.75 + 0.25 * 0.6 + 0.25 * 0 + 0.2 * 0.3;
            expect(result[0].risk).toBeCloseTo(helperRisk, 10);

            const buttonRisk = 0.3 * 0.2 + 0.25 * 0.4 + 0.25 * 0 + 0.2 * 0.8;
            expect(result[1].risk).toBeCloseTo(buttonRisk, 10);

            const apiRisk = 0.3 * 0.9 + 0.25 * 0.85 + 0.25 * 1 + 0.2 * 0.5;
            expect(result[2].risk).toBeCloseTo(apiRisk, 10);
            expect(result[2].risk).toBeGreaterThan(result[0].risk);
            expect(result[2].risk).toBeGreaterThan(result[1].risk);
        });

        it('should verify weights sum to 1.0', () => {
            const weights = [0.3, 0.25, 0.25, 0.2];
            const sum = weights.reduce((a, b) => a + b, 0);
            expect(sum).toBe(1.0);
        });

        it('should handle edge case with very small metric values', () => {
            const fileMetrics = new Map([
                ['file1.ts', {
                    centrality: 0.0001,
                    coupling: 0.0002,
                    circularDependency: 0,
                    churn: 0.0003,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            const expectedRisk = 0.3 * 0.0001 + 0.25 * 0.0002 + 0.25 * 0 + 0.2 * 0.0003;
            expect(result[0].risk).toBeCloseTo(expectedRisk, 10);
            expect(result[0].risk).toBeGreaterThan(0);
            expect(result[0].risk).toBeLessThan(0.001);
        });

        it('should handle files with values at boundaries (0 and 1)', () => {
            const fileMetrics = new Map([
                ['boundary-file.ts', {
                    centrality: 1,
                    coupling: 0,
                    circularDependency: 1,
                    churn: 0,
                }],
            ]);

            const result = computeRisk(fileMetrics);
            const expectedRisk = 0.3 * 1 + 0.25 * 0 + 0.25 * 1 + 0.2 * 0;
            expect(result[0].risk).toBe(expectedRisk);
            expect(result[0].risk).toBe(0.55);
        });
    });
});
