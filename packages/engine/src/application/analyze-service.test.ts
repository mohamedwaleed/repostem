import { describe, it, expect, vi } from 'vitest';
import {
    analyzeRepository,
    analyzeFileRisk,
    computeFileImpact,
    detectRepositoryCycles,
    explainFileRisk,
    explainFileImpact
} from './analyze-service';

// Mock parser
vi.mock('../core/parser/parser', () => ({
    default: vi.fn(() => new Map([
        ['src/index.ts', new Set(['src/utils/helper.ts'])],
        ['src/utils/helper.ts', new Set()],
    ]))
}));

// Mock dependency graph
vi.mock('../core/dependency-graph/dependency-graph', () => ({
    buildDependencyGraph: vi.fn(() => ({
        getNode: vi.fn((path: string) => {
            // Only return true for known files
            return path === 'src/index.ts' || path === 'src/utils/helper.ts' || path === 'src/empty.ts';
        }),
        getNodes: vi.fn(() => new Set(['src/index.ts', 'src/utils/helper.ts', 'src/empty.ts'])),
        getEdges: vi.fn(() => new Map([['src/index.ts', new Set(['src/utils/helper.ts'])]])),
        detectCycles: vi.fn(() => [])
    }))
}));

// Mock metrics engine
vi.mock('../core/metrics-engine/metrics-engine', () => ({
    computeFileMetrics: vi.fn().mockResolvedValue({
        centrality: 0.5,
        coupling: 0.3,
        churn: 0.2,
        circularDependency: 0
    }),
    computeMetrics: vi.fn().mockResolvedValue(new Map([
        ['src/index.ts', { centrality: 0.5, coupling: 0.3, churn: 0.2, circularDependency: 0 }],
        ['src/utils/helper.ts', { centrality: 0.8, coupling: 0.4, churn: 0.1, circularDependency: 0 }]
    ]))
}));

// Mock risk engine
vi.mock('../core/risk-engine/risk-engine', () => ({
    computeFileRisk: vi.fn(() => ({
        file: 'src/index.ts',
        riskScore: 0.35,
        riskLevel: 'MEDIUM'
    })),
    computeRisk: vi.fn(() => [
        { file: 'src/index.ts', riskScore: 0.35, riskLevel: 'MEDIUM' },
        { file: 'src/utils/helper.ts', riskScore: 0.28, riskLevel: 'LOW' }
    ])
}));

// Mock impact engine
vi.mock('../core/impact-engine/impact-engine', () => ({
    computeImpact: vi.fn((graph: any, filePath: string) => {
        // Throw for non-existent files
        if (filePath === 'src/non-existent-file.ts') {
            throw new Error(`File ${filePath} not found in metrics`);
        }
        return {
            file: filePath,
            directDependents: ['src/index.ts'],
            transitiveDependents: ['src/index.ts'],
            totalImpactCount: 1
        };
    })
}));

// Mock snapshot builder
vi.mock('../core/snapshot-builder', () => ({
    buildSnapshot: vi.fn().mockResolvedValue({
        metadata: {
            id: 'test-snapshot-id',
            repoId: 'test-repo-id',
            branch: 'main',
            commitHash: 'abc123',
            dirty: false,
            createdAt: new Date()
        },
        summary: {
            totalFiles: 2,
            totalDependencies: 1,
            cycleCount: 0
        },
        files: new Map([
            ['src/index.ts', { path: 'src/index.ts', metrics: { centrality: 0.5, coupling: 0.3, churn: 0.2 }, riskScore: 0.35, riskLevel: 'medium' }],
            ['src/utils/helper.ts', { path: 'src/utils/helper.ts', metrics: { centrality: 0.8, coupling: 0.4, churn: 0.1 }, riskScore: 0.28, riskLevel: 'low' }]
        ]),
        edges: new Map([['src/index.ts', new Set(['src/utils/helper.ts'])]]),
        cycles: []
    })
}));

vi.mock('../repository-metrics/snapshot-summary', () => ({
    buildSnapshotSummary: vi.fn(() => ({
        totalFiles: 2,
        totalDependencies: 1,
        cycleCount: 0,
        topCentralFiles: [
            { file: 'src/utils/helper.ts', score: 0.8 },
            { file: 'src/index.ts', score: 0.5 }
        ],
        topRiskFiles: [
            { file: 'src/index.ts', score: 0.35 },
            { file: 'src/utils/helper.ts', score: 0.28 }
        ],
        highChurnFiles: [],
        signals: {
            cycleCount: 0,
            highChurnFileCount: 0
        }
    }))
}));

// Mock AI explanation layer
vi.mock('../ai-explanation-layer/intent-router', () => ({
    detectIntent: vi.fn((question: string) => {
        if (question.toLowerCase().includes('risk')) return 'risk';
        if (question.toLowerCase().includes('impact')) return 'impact';
        return 'unknown';
    }),
    explainRiskIntent: vi.fn((fileAnalysis: any) => {
        return `AI explanation for ${fileAnalysis.file} with risk score ${fileAnalysis.riskScore}`;
    }),
    explainImpactIntent: vi.fn((fileImpact: any) => {
        return `AI impact explanation for ${fileImpact.file} affecting ${fileImpact.totalImpactCount} files`;
    })
}));

// Mock persistence
vi.mock('../persistence/snapshot-persister', () => ({
    tryPersistSnapshot: vi.fn().mockResolvedValue({
        persisted: false,
        warning: 'Snapshot will not be persisted. Run repostem init to configure persistence.'
    })
}));

const basicRepoPath = '/tmp/test-repo';

describe('AnalyzeService - analyzeRepository', () => {
    describe('Project-level Analysis', () => {
        it('should analyze a basic repository and return project metrics', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result).toBeDefined();
            expect(result.analysis).toBeDefined();
            expect(result.analysis.totalFiles).toBeGreaterThan(0);
            expect(result.analysis.totalDependencies).toBeGreaterThanOrEqual(0);
            expect(result.analysis.cycleCount).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(result.analysis.topCentralFiles)).toBe(true);
            expect(Array.isArray(result.analysis.topRiskFiles)).toBe(true);
            expect(Array.isArray(result.analysis.highChurnFiles)).toBe(true);
        });

        it('should return top 5 central files sorted by centrality', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result.analysis.topCentralFiles.length).toBeLessThanOrEqual(5);
            
            for (let i = 0; i < result.analysis.topCentralFiles.length - 1; i++) {
                expect(result.analysis.topCentralFiles[i].score).toBeGreaterThanOrEqual(
                    result.analysis.topCentralFiles[i + 1].score
                );
            }

            result.analysis.topCentralFiles.forEach(file => {
                expect(file).toHaveProperty('file');
                expect(file).toHaveProperty('score');
                expect(typeof file.file).toBe('string');
                expect(typeof file.score).toBe('number');
            });
        });

        it('should return top 5 risk files sorted by risk score', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result.analysis.topRiskFiles.length).toBeLessThanOrEqual(5);
            
            for (let i = 0; i < result.analysis.topRiskFiles.length - 1; i++) {
                expect(result.analysis.topRiskFiles[i].score).toBeGreaterThanOrEqual(
                    result.analysis.topRiskFiles[i + 1].score
                );
            }

            result.analysis.topRiskFiles.forEach(file => {
                expect(file).toHaveProperty('file');
                expect(file).toHaveProperty('score');
                expect(file.score).toBeGreaterThanOrEqual(0);
                expect(file.score).toBeLessThanOrEqual(1);
            });
        });

        it('should filter high churn files (churn > 0.6)', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(Array.isArray(result.analysis.highChurnFiles)).toBe(true);
            expect(result.analysis.highChurnFiles.length).toBeLessThanOrEqual(5);
            
            result.analysis.highChurnFiles.forEach(file => {
                expect(file.score).toBeGreaterThan(0.6);
            });

            for (let i = 0; i < result.analysis.highChurnFiles.length - 1; i++) {
                expect(result.analysis.highChurnFiles[i].score).toBeGreaterThanOrEqual(
                    result.analysis.highChurnFiles[i + 1].score
                );
            }
        });

        it('should count total files correctly', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result.analysis.totalFiles).toBeGreaterThan(0);
            expect(Number.isInteger(result.analysis.totalFiles)).toBe(true);
        });

        it('should count total dependencies correctly', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result.analysis.totalDependencies).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(result.analysis.totalDependencies)).toBe(true);
        });

        it('should detect and count cycles', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result.analysis.cycleCount).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(result.analysis.cycleCount)).toBe(true);
        });

        it('should return persistence result with warning when not configured', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result.persisted).toBe(false);
            expect(result.warning).toBeDefined();
            expect(result.warning).toContain('not be persisted');
        });

        it('should handle repositories with fewer than 5 files', async () => {
            const result = await analyzeRepository(basicRepoPath);

            if (result.analysis.totalFiles < 5) {
                expect(result.analysis.topCentralFiles.length).toBeLessThanOrEqual(result.analysis.totalFiles);
                expect(result.analysis.topRiskFiles.length).toBeLessThanOrEqual(result.analysis.totalFiles);
            }
        });

        it('should maintain consistency across multiple analyses', async () => {
            const analysis1 = await analyzeRepository(basicRepoPath);
            const analysis2 = await analyzeRepository(basicRepoPath);

            expect(analysis1.analysis.totalFiles).toBe(analysis2.analysis.totalFiles);
            expect(analysis1.analysis.totalDependencies).toBe(analysis2.analysis.totalDependencies);
            expect(analysis1.analysis.cycleCount).toBe(analysis2.analysis.cycleCount);
        });
    });
});

describe('AnalyzeService - analyzeFileRisk', () => {
    describe('File-level Risk Analysis', () => {
        it('should analyze risk for a specific file', async () => {
            const filePath = 'src/index.ts';
            const result = await analyzeFileRisk(basicRepoPath, filePath);

            expect(result).toBeDefined();
            expect(result.file).toBe(filePath);
            expect(result).toHaveProperty('centrality');
            expect(result).toHaveProperty('coupling');
            expect(result).toHaveProperty('churn');
            expect(result).toHaveProperty('hasCircularDependency');
            expect(result).toHaveProperty('riskScore');
            expect(result).toHaveProperty('riskLevel');
        });

        it('should return metrics within valid ranges', async () => {
            const filePath = 'src/index.ts';
            const result = await analyzeFileRisk(basicRepoPath, filePath);

            expect(result.centrality).toBeGreaterThanOrEqual(0);
            expect(result.centrality).toBeLessThanOrEqual(1);
            expect(result.coupling).toBeGreaterThanOrEqual(0);
            expect(result.coupling).toBeLessThanOrEqual(1);
            expect(result.churn).toBeGreaterThanOrEqual(0);
            expect(result.churn).toBeLessThanOrEqual(1);
            expect(result.riskScore).toBeGreaterThanOrEqual(0);
            expect(result.riskScore).toBeLessThanOrEqual(1);
        });

        it('should return boolean for circular dependency flag', async () => {
            const filePath = 'src/index.ts';
            const result = await analyzeFileRisk(basicRepoPath, filePath);

            expect(typeof result.hasCircularDependency).toBe('boolean');
        });

        it('should throw error for non-existent file', async () => {
            const nonExistentFile = 'src/non-existent-file.ts';

            await expect(
                analyzeFileRisk(basicRepoPath, nonExistentFile)
            ).rejects.toThrow(/not found/i);
        });

        it('should throw descriptive error for missing file', async () => {
            const missingFile = 'src/does-not-exist.ts';

            await expect(
                analyzeFileRisk(basicRepoPath, missingFile)
            ).rejects.toThrow(/not found/i);
        });

        it('should handle invalid file paths gracefully', async () => {
            const invalidPath = '';

            await expect(
                analyzeFileRisk(basicRepoPath, invalidPath)
            ).rejects.toThrow();
        });

        it('should handle multiple file analyses independently', async () => {
            const file1 = 'src/index.ts';
            const file2 = 'src/utils/helper.ts';

            const result1 = await analyzeFileRisk(basicRepoPath, file1);
            const result2 = await analyzeFileRisk(basicRepoPath, file2);

            expect(result1.file).toBe(file1);
            expect(result2.file).toBe(file2);
            expect(result1.file).not.toBe(result2.file);
        });
    });
});

describe('AnalyzeService - computeFileImpact', () => {
    describe('Impact Analysis', () => {
        it('should compute impact for a specific file', async () => {
            const filePath = 'src/utils/helper.ts';
            const result = await computeFileImpact(basicRepoPath, filePath);

            expect(result).toBeDefined();
            expect(result.file).toBe(filePath);
            expect(result).toHaveProperty('directDependents');
            expect(result).toHaveProperty('transitiveDependents');
            expect(result).toHaveProperty('totalImpactCount');
        });

        it('should return arrays for dependents', async () => {
            const filePath = 'src/utils/helper.ts';
            const result = await computeFileImpact(basicRepoPath, filePath);

            expect(Array.isArray(result.directDependents)).toBe(true);
            expect(Array.isArray(result.transitiveDependents)).toBe(true);
        });

        it('should calculate total impact count correctly', async () => {
            const filePath = 'src/utils/helper.ts';
            const result = await computeFileImpact(basicRepoPath, filePath);

            expect(result.totalImpactCount).toBe(result.transitiveDependents.length);
            expect(Number.isInteger(result.totalImpactCount)).toBe(true);
            expect(result.totalImpactCount).toBeGreaterThanOrEqual(0);
        });

        it('should handle files with no dependents', async () => {
            const filePath = 'src/index.ts';
            const result = await computeFileImpact(basicRepoPath, filePath);

            expect(result.directDependents).toBeDefined();
            expect(result.transitiveDependents).toBeDefined();
            expect(result.totalImpactCount).toBeGreaterThanOrEqual(0);
        });

        it('should not include the file itself in dependents', async () => {
            const filePath = 'src/utils/helper.ts';
            const result = await computeFileImpact(basicRepoPath, filePath);

            expect(result.directDependents).not.toContain(filePath);
            expect(result.transitiveDependents).not.toContain(filePath);
        });

        it('should compute transitive dependents correctly', async () => {
            const filePath = 'src/utils/helper.ts';
            const result = await computeFileImpact(basicRepoPath, filePath);

            expect(result.transitiveDependents.length).toBeGreaterThanOrEqual(
                result.directDependents.length
            );
        });

        it('should not have duplicates in transitive dependents', async () => {
            const filePath = 'src/utils/helper.ts';
            const result = await computeFileImpact(basicRepoPath, filePath);

            const uniqueDependents = new Set(result.transitiveDependents);
            expect(uniqueDependents.size).toBe(result.transitiveDependents.length);
        });

        it('should throw error for non-existent file', async () => {
            const nonExistentFile = 'src/non-existent-file.ts';

            await expect(
                computeFileImpact(basicRepoPath, nonExistentFile)
            ).rejects.toThrow(/not found/i);
        });
    });
});

describe('AnalyzeService - detectRepositoryCycles', () => {
    describe('Cycle Detection', () => {
        it('should detect cycles in repository', async () => {
            const result = await detectRepositoryCycles(basicRepoPath);

            expect(Array.isArray(result)).toBe(true);
        });

        it('should return empty array when no cycles exist', async () => {
            const result = await detectRepositoryCycles(basicRepoPath);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(0);
        });

        it('should return cycle objects with nodes array', async () => {
            const result = await detectRepositoryCycles(basicRepoPath);

            result.forEach(cycle => {
                expect(cycle).toHaveProperty('nodes');
                expect(Array.isArray(cycle.nodes)).toBe(true);
            });
        });

        it('should detect cycles with at least 2 nodes', async () => {
            const result = await detectRepositoryCycles(basicRepoPath);

            result.forEach(cycle => {
                if (cycle.nodes.length > 0) {
                    expect(cycle.nodes.length).toBeGreaterThanOrEqual(2);
                }
            });
        });

        it('should return valid file paths in cycle nodes', async () => {
            const result = await detectRepositoryCycles(basicRepoPath);

            result.forEach(cycle => {
                cycle.nodes.forEach(node => {
                    expect(typeof node).toBe('string');
                    expect(node.length).toBeGreaterThan(0);
                });
            });
        });
    });
});

describe('AnalyzeService - explainFileRisk', () => {
    describe('AI Explanation', () => {
        it('should generate explanation for file risk', async () => {
            const filePath = 'src/index.ts';
            const result = await explainFileRisk(basicRepoPath, filePath);

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should include file path in explanation', async () => {
            const filePath = 'src/index.ts';
            const result = await explainFileRisk(basicRepoPath, filePath);

            expect(result).toContain(filePath);
        });

        it('should throw error for non-existent file', async () => {
            const nonExistentFile = 'src/non-existent.ts';

            await expect(
                explainFileRisk(basicRepoPath, nonExistentFile)
            ).rejects.toThrow(/not found/i);
        });

        it('should generate different explanations for different files', async () => {
            const file1 = 'src/index.ts';
            const file2 = 'src/utils/helper.ts';

            const result1 = await explainFileRisk(basicRepoPath, file1);
            const result2 = await explainFileRisk(basicRepoPath, file2);

            expect(result1).not.toBe(result2);
        });
    });

    describe('useAI Parameter', () => {
        it('should use AI explanation when useAI is true', async () => {
            const filePath = 'src/index.ts';
            const result = await explainFileRisk(basicRepoPath, filePath, true);

            expect(typeof result).toBe('string');
            expect(result).toContain('AI explanation');
            expect(result).toContain(filePath);
        });

        it('should use simple template when useAI is false', async () => {
            const filePath = 'src/index.ts';
            const result = await explainFileRisk(basicRepoPath, filePath, false);

            expect(typeof result).toBe('string');
            expect(result).toContain(filePath);
            expect(result).toMatch(/risk score/i);
            expect(result).toMatch(/centrality/i);
            expect(result).toMatch(/coupling/i);
            expect(result).toMatch(/churn/i);
        });

        it('should return different output formats based on useAI parameter', async () => {
            const filePath = 'src/index.ts';
            
            const resultWithAI = await explainFileRisk(basicRepoPath, filePath, true);
            const resultWithoutAI = await explainFileRisk(basicRepoPath, filePath, false);

            expect(resultWithAI).not.toBe(resultWithoutAI);
            expect(resultWithAI).toContain('AI explanation');
            expect(resultWithoutAI).not.toContain('AI explanation');
        });

        it('should default to using AI when useAI parameter is omitted', async () => {
            const filePath = 'src/index.ts';
            const resultWithoutParam = await explainFileRisk(basicRepoPath, filePath);
            const resultWithTrue = await explainFileRisk(basicRepoPath, filePath, true);

            expect(resultWithoutParam).toBe(resultWithTrue);
        });
    });
});

describe('AnalyzeService - explainFileImpact', () => {
    describe('AI Explanation', () => {
        it('should generate explanation for file impact', async () => {
            const filePath = 'src/utils/helper.ts';
            const result = await explainFileImpact(basicRepoPath, filePath);

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should include file path in explanation', async () => {
            const filePath = 'src/utils/helper.ts';
            const result = await explainFileImpact(basicRepoPath, filePath);

            expect(result).toContain(filePath);
        });

        it('should throw error for non-existent file', async () => {
            const nonExistentFile = 'src/non-existent.ts';

            await expect(
                explainFileImpact(basicRepoPath, nonExistentFile)
            ).rejects.toThrow(/not found/i);
        });
    });

    describe('useAI Parameter', () => {
        it('should use AI explanation when useAI is true', async () => {
            const filePath = 'src/utils/helper.ts';
            const result = await explainFileImpact(basicRepoPath, filePath, true);

            expect(result).toContain('AI impact explanation');
        });

        it('should use simple template when useAI is false', async () => {
            const filePath = 'src/utils/helper.ts';
            const result = await explainFileImpact(basicRepoPath, filePath, false);

            expect(result).toContain(filePath);
            expect(result).toMatch(/dependents/i);
        });
    });
});

describe('AnalyzeService - Integration Tests', () => {
    describe('End-to-End Workflow', () => {
        it('should complete full analysis workflow', async () => {
            const projectAnalysis = await analyzeRepository(basicRepoPath);
            expect(projectAnalysis).toBeDefined();

            if (projectAnalysis.analysis.topRiskFiles.length > 0) {
                const topRiskFile = projectAnalysis.analysis.topRiskFiles[0].file;
                
                const fileRisk = await analyzeFileRisk(basicRepoPath, topRiskFile);
                expect(fileRisk).toBeDefined();
                expect(fileRisk.file).toBe(topRiskFile);

                const fileImpact = await computeFileImpact(basicRepoPath, topRiskFile);
                expect(fileImpact).toBeDefined();
                expect(fileImpact.file).toBe(topRiskFile);

                const explanation = await explainFileRisk(basicRepoPath, topRiskFile);
                expect(explanation).toBeDefined();
                expect(typeof explanation).toBe('string');
            }
        });

        it('should handle repository with cycles', async () => {
            const cycles = await detectRepositoryCycles(basicRepoPath);
            const projectAnalysis = await analyzeRepository(basicRepoPath);

            expect(projectAnalysis.analysis.cycleCount).toBe(cycles.length);
        });

        it('should complete repository analysis in reasonable time', async () => {
            const startTime = Date.now();
            await analyzeRepository(basicRepoPath);
            const endTime = Date.now();

            const duration = endTime - startTime;
            expect(duration).toBeLessThan(30000);
        });

        it('should handle multiple concurrent file analyses', async () => {
            const files = [
                'src/index.ts',
                'src/utils/helper.ts',
                'src/empty.ts'
            ];

            const promises = files.map(file => 
                analyzeFileRisk(basicRepoPath, file).catch(() => null)
            );

            const results = await Promise.all(promises);
            const validResults = results.filter(r => r !== null);
            
            expect(validResults.length).toBeGreaterThan(0);
        });
    });
});
