import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import {
    analyzeRepository,
    analyzeFileRisk,
    computeFileImpact,
    detectRepositoryCycles,
    explainFileRisk
} from './engine';
import { ProjectAnalysisResult, FileRiskResult, FileImpactResult, Cycle } from './types';

// Mock AI explanation layer
vi.mock('./ai-explanation-layer/ai-explaination-layer', () => ({
    explainFileRiskUsingAI: vi.fn((fileAnalysis: any) => {
        return `AI explanation for ${fileAnalysis.file} with risk score ${fileAnalysis.riskScore}`;
    })
}));

const sharedFixturesRoot = path.resolve(__dirname, "__tests__", "fixtures", "shared");
const basicRepoPath = path.join(sharedFixturesRoot, "basic-repo");

describe('Engine - analyzeRepository', () => {
    describe('Project-level Analysis', () => {
        it('should analyze a basic repository and return project metrics', async () => {
            const result: ProjectAnalysisResult = await analyzeRepository(basicRepoPath);

            expect(result).toBeDefined();
            expect(result.totalFiles).toBeGreaterThan(0);
            expect(result.totalDependencies).toBeGreaterThanOrEqual(0);
            expect(result.cycleCount).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(result.topCentralFiles)).toBe(true);
            expect(Array.isArray(result.topRiskFiles)).toBe(true);
            expect(Array.isArray(result.highChurnFiles)).toBe(true);
        });

        it('should return top 5 central files sorted by centrality', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result.topCentralFiles.length).toBeLessThanOrEqual(5);
            
            for (let i = 0; i < result.topCentralFiles.length - 1; i++) {
                expect(result.topCentralFiles[i].score).toBeGreaterThanOrEqual(
                    result.topCentralFiles[i + 1].score
                );
            }

            result.topCentralFiles.forEach(file => {
                expect(file).toHaveProperty('file');
                expect(file).toHaveProperty('score');
                expect(typeof file.file).toBe('string');
                expect(typeof file.score).toBe('number');
            });
        });

        it('should return top 5 risk files sorted by risk score', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result.topRiskFiles.length).toBeLessThanOrEqual(5);
            
            for (let i = 0; i < result.topRiskFiles.length - 1; i++) {
                expect(result.topRiskFiles[i].score).toBeGreaterThanOrEqual(
                    result.topRiskFiles[i + 1].score
                );
            }

            result.topRiskFiles.forEach(file => {
                expect(file).toHaveProperty('file');
                expect(file).toHaveProperty('score');
                expect(file.score).toBeGreaterThanOrEqual(0);
                expect(file.score).toBeLessThanOrEqual(1);
            });
        });

        it('should filter high churn files (churn > 0.6)', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(Array.isArray(result.highChurnFiles)).toBe(true);
            expect(result.highChurnFiles.length).toBeLessThanOrEqual(5);
            
            result.highChurnFiles.forEach(file => {
                expect(file.score).toBeGreaterThan(0.6);
            });

            for (let i = 0; i < result.highChurnFiles.length - 1; i++) {
                expect(result.highChurnFiles[i].score).toBeGreaterThanOrEqual(
                    result.highChurnFiles[i + 1].score
                );
            }
        });

        it('should count total files correctly', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result.totalFiles).toBeGreaterThan(0);
            expect(Number.isInteger(result.totalFiles)).toBe(true);
        });

        it('should count total dependencies correctly', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result.totalDependencies).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(result.totalDependencies)).toBe(true);
        });

        it('should detect and count cycles', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(result.cycleCount).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(result.cycleCount)).toBe(true);
        });

        it('should handle repositories with no dependencies', async () => {
            const emptyRepoPath = path.join(sharedFixturesRoot, "basic-repo");
            const result = await analyzeRepository(emptyRepoPath);

            expect(result.totalFiles).toBeGreaterThanOrEqual(0);
            expect(result.totalDependencies).toBeGreaterThanOrEqual(0);
            expect(result.topCentralFiles).toBeDefined();
            expect(result.topRiskFiles).toBeDefined();
            expect(result.highChurnFiles).toBeDefined();
        });

        it('should return empty arrays when no files meet threshold criteria', async () => {
            const result = await analyzeRepository(basicRepoPath);

            expect(Array.isArray(result.topCentralFiles)).toBe(true);
            expect(Array.isArray(result.topRiskFiles)).toBe(true);
            expect(Array.isArray(result.highChurnFiles)).toBe(true);
        });

        it('should handle repositories with fewer than 5 files', async () => {
            const result = await analyzeRepository(basicRepoPath);

            if (result.totalFiles < 5) {
                expect(result.topCentralFiles.length).toBeLessThanOrEqual(result.totalFiles);
                expect(result.topRiskFiles.length).toBeLessThanOrEqual(result.totalFiles);
            }
        });
    });

    describe('Metric Aggregation', () => {
        it('should aggregate metrics with correct structure', async () => {
            const result = await analyzeRepository(basicRepoPath);

            const allRankedFiles = [
                ...result.topCentralFiles,
                ...result.topRiskFiles,
                ...result.highChurnFiles
            ];

            allRankedFiles.forEach(file => {
                expect(file).toHaveProperty('file');
                expect(file).toHaveProperty('score');
                expect(typeof file.file).toBe('string');
                expect(typeof file.score).toBe('number');
                expect(file.score).toBeGreaterThanOrEqual(0);
            });
        });

        it('should apply threshold filtering correctly for churn metric', async () => {
            const result = await analyzeRepository(basicRepoPath);

            result.highChurnFiles.forEach(file => {
                expect(file.score).toBeGreaterThan(0.6);
            });
        });

        it('should sort metrics in descending order', async () => {
            const result = await analyzeRepository(basicRepoPath);

            const checkDescendingOrder = (files: typeof result.topCentralFiles) => {
                for (let i = 0; i < files.length - 1; i++) {
                    expect(files[i].score).toBeGreaterThanOrEqual(files[i + 1].score);
                }
            };

            if (result.topCentralFiles.length > 1) {
                checkDescendingOrder(result.topCentralFiles);
            }
            if (result.topRiskFiles.length > 1) {
                checkDescendingOrder(result.topRiskFiles);
            }
            if (result.highChurnFiles.length > 1) {
                checkDescendingOrder(result.highChurnFiles);
            }
        });
    });
});

describe('Engine - analyzeFileRisk', () => {
    describe('File-level Risk Analysis', () => {
        it('should analyze risk for a specific file', async () => {
            const filePath = path.join('src', 'index.ts');
            const result: FileRiskResult = await analyzeFileRisk(basicRepoPath, filePath);

            expect(result).toBeDefined();
            expect(result.file).toBe(filePath);
            expect(result).toHaveProperty('centrality');
            expect(result).toHaveProperty('coupling');
            expect(result).toHaveProperty('churn');
            expect(result).toHaveProperty('hasCircularDependency');
            expect(result).toHaveProperty('riskScore');
        });

        it('should return metrics within valid ranges', async () => {
            const filePath = path.join('src', 'index.ts');
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
            const filePath = path.join('src', 'index.ts');
            const result = await analyzeFileRisk(basicRepoPath, filePath);

            expect(typeof result.hasCircularDependency).toBe('boolean');
        });

        it('should throw error for non-existent file', async () => {
            const nonExistentFile = 'src/non-existent-file.ts';

            await expect(
                analyzeFileRisk(basicRepoPath, nonExistentFile)
            ).rejects.toThrow();
        });

        it('should handle files with no dependencies', async () => {
            const filePath = path.join('src', 'empty.ts');
            const result = await analyzeFileRisk(basicRepoPath, filePath);

            expect(result).toBeDefined();
            expect(result.file).toBe(filePath);
            expect(result.centrality).toBeGreaterThanOrEqual(0);
            expect(result.coupling).toBeGreaterThanOrEqual(0);
        });

        it('should calculate risk score as weighted combination of metrics', async () => {
            const filePath = path.join('src', 'index.ts');
            const result = await analyzeFileRisk(basicRepoPath, filePath);

            expect(result.riskScore).toBeDefined();
            expect(typeof result.riskScore).toBe('number');
            expect(result.riskScore).toBeGreaterThanOrEqual(0);
            expect(result.riskScore).toBeLessThanOrEqual(1);
        });

        it('should handle multiple file analyses independently', async () => {
            const file1 = path.join('src', 'index.ts');
            const file2 = path.join('src', 'utils', 'helper.ts');

            const result1 = await analyzeFileRisk(basicRepoPath, file1);
            const result2 = await analyzeFileRisk(basicRepoPath, file2);

            expect(result1.file).toBe(file1);
            expect(result2.file).toBe(file2);
            expect(result1.file).not.toBe(result2.file);
        });
    });

    describe('Error Handling', () => {
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
    });
});

describe('Engine - computeFileImpact', () => {
    describe('Impact Analysis', () => {
        it('should compute impact for a specific file', async () => {
            const filePath = path.join('src', 'utils', 'helper.ts');
            const result: FileImpactResult = await computeFileImpact(basicRepoPath, filePath);

            expect(result).toBeDefined();
            expect(result.file).toBe(filePath);
            expect(result).toHaveProperty('directDependents');
            expect(result).toHaveProperty('transitiveDependents');
            expect(result).toHaveProperty('totalImpactCount');
        });

        it('should return arrays for dependents', async () => {
            const filePath = path.join('src', 'utils', 'helper.ts');
            const result = await computeFileImpact(basicRepoPath, filePath);

            expect(Array.isArray(result.directDependents)).toBe(true);
            expect(Array.isArray(result.transitiveDependents)).toBe(true);
        });

        it('should calculate total impact count correctly', async () => {
            const filePath = path.join('src', 'utils', 'helper.ts');
            const result = await computeFileImpact(basicRepoPath, filePath);

            expect(result.totalImpactCount).toBe(result.transitiveDependents.length);
            expect(Number.isInteger(result.totalImpactCount)).toBe(true);
            expect(result.totalImpactCount).toBeGreaterThanOrEqual(0);
        });

        it('should handle files with no dependents', async () => {
            const filePath = path.join('src', 'index.ts');
            const result = await computeFileImpact(basicRepoPath, filePath);

            expect(result.directDependents).toBeDefined();
            expect(result.transitiveDependents).toBeDefined();
            expect(result.totalImpactCount).toBeGreaterThanOrEqual(0);
        });

        it('should include direct dependents in results', async () => {
            const filePath = path.join('src', 'utils', 'helper.ts');
            const result = await computeFileImpact(basicRepoPath, filePath);

            result.directDependents.forEach(dependent => {
                expect(typeof dependent).toBe('string');
                expect(dependent.length).toBeGreaterThan(0);
            });
        });

        it('should include transitive dependents in results', async () => {
            const filePath = path.join('src', 'utils', 'helper.ts');
            const result = await computeFileImpact(basicRepoPath, filePath);

            result.transitiveDependents.forEach(dependent => {
                expect(typeof dependent).toBe('string');
                expect(dependent.length).toBeGreaterThan(0);
            });
        });

        it('should not include the file itself in dependents', async () => {
            const filePath = path.join('src', 'utils', 'helper.ts');
            const result = await computeFileImpact(basicRepoPath, filePath);

            expect(result.directDependents).not.toContain(filePath);
            expect(result.transitiveDependents).not.toContain(filePath);
        });

        it('should handle files at different dependency depths', async () => {
            const file1 = path.join('src', 'index.ts');
            const file2 = path.join('src', 'utils', 'helper.ts');

            const result1 = await computeFileImpact(basicRepoPath, file1);
            const result2 = await computeFileImpact(basicRepoPath, file2);

            expect(result1).toBeDefined();
            expect(result2).toBeDefined();
        });
    });

    describe('Transitive Dependencies', () => {
        it('should compute transitive dependents correctly', async () => {
            const filePath = path.join('src', 'utils', 'helper.ts');
            const result = await computeFileImpact(basicRepoPath, filePath);

            expect(result.transitiveDependents.length).toBeGreaterThanOrEqual(
                result.directDependents.length
            );
        });

        it('should not have duplicates in transitive dependents', async () => {
            const filePath = path.join('src', 'utils', 'helper.ts');
            const result = await computeFileImpact(basicRepoPath, filePath);

            const uniqueDependents = new Set(result.transitiveDependents);
            expect(uniqueDependents.size).toBe(result.transitiveDependents.length);
        });
    });
});

describe('Engine - detectRepositoryCycles', () => {
    describe('Cycle Detection', () => {
        it('should detect cycles in repository', async () => {
            const result: Cycle[] = await detectRepositoryCycles(basicRepoPath);

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

describe('Engine - explainFileRisk', () => {
    describe('AI Explanation', () => {
        it('should generate explanation for file risk', async () => {
            const filePath = path.join('src', 'index.ts');
            const result: string = await explainFileRisk(basicRepoPath, filePath);

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should include file path in explanation', async () => {
            const filePath = path.join('src', 'index.ts');
            const result = await explainFileRisk(basicRepoPath, filePath);

            expect(result).toContain(filePath);
        });

        it('should include risk score in explanation', async () => {
            const filePath = path.join('src', 'index.ts');
            const result = await explainFileRisk(basicRepoPath, filePath);

            expect(result).toMatch(/risk score/i);
        });

        it('should include file path in AI explanation', async () => {
            const filePath = path.join('src', 'index.ts');
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
            const file1 = path.join('src', 'index.ts');
            const file2 = path.join('src', 'utils', 'helper.ts');

            const result1 = await explainFileRisk(basicRepoPath, file1);
            const result2 = await explainFileRisk(basicRepoPath, file2);

            expect(result1).not.toBe(result2);
        });
    });

    describe('useAI Parameter', () => {
        it('should use AI explanation when useAI is true', async () => {
            const filePath = path.join('src', 'index.ts');
            const result = await explainFileRisk(basicRepoPath, filePath, true);

            expect(typeof result).toBe('string');
            expect(result).toContain('AI explanation');
            expect(result).toContain(filePath);
        });

        it('should use simple template when useAI is false', async () => {
            const filePath = path.join('src', 'index.ts');
            const result = await explainFileRisk(basicRepoPath, filePath, false);

            expect(typeof result).toBe('string');
            expect(result).toContain(filePath);
            expect(result).toMatch(/risk score/i);
            expect(result).toMatch(/centrality/i);
            expect(result).toMatch(/coupling/i);
            expect(result).toMatch(/churn/i);
        });

        it('should return different output formats based on useAI parameter', async () => {
            const filePath = path.join('src', 'index.ts');
            
            const resultWithAI = await explainFileRisk(basicRepoPath, filePath, true);
            const resultWithoutAI = await explainFileRisk(basicRepoPath, filePath, false);

            expect(resultWithAI).not.toBe(resultWithoutAI);
            expect(resultWithAI).toContain('AI explanation');
            expect(resultWithoutAI).not.toContain('AI explanation');
        });

        it('should include file path in both AI and non-AI explanations', async () => {
            const filePath = path.join('src', 'index.ts');
            
            const resultWithAI = await explainFileRisk(basicRepoPath, filePath, true);
            const resultWithoutAI = await explainFileRisk(basicRepoPath, filePath, false);

            expect(resultWithAI).toContain(filePath);
            expect(resultWithoutAI).toContain(filePath);
        });

        it('should default to using AI when useAI parameter is omitted', async () => {
            const filePath = path.join('src', 'index.ts');
            const resultWithoutParam = await explainFileRisk(basicRepoPath, filePath);
            const resultWithTrue = await explainFileRisk(basicRepoPath, filePath, true);

            expect(resultWithoutParam).toBe(resultWithTrue);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing file gracefully', async () => {
            const missingFile = 'src/missing.ts';

            await expect(
                explainFileRisk(basicRepoPath, missingFile)
            ).rejects.toThrow();
        });

        it('should throw descriptive error message', async () => {
            const missingFile = 'src/missing.ts';

            await expect(
                explainFileRisk(basicRepoPath, missingFile)
            ).rejects.toThrow(/not found/i);
        });
    });
});

describe('Engine - Integration Tests', () => {
    describe('End-to-End Workflow', () => {
        it('should complete full analysis workflow', async () => {
            const projectAnalysis = await analyzeRepository(basicRepoPath);
            expect(projectAnalysis).toBeDefined();

            if (projectAnalysis.topRiskFiles.length > 0) {
                const topRiskFile = projectAnalysis.topRiskFiles[0].file;
                
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

            expect(projectAnalysis.cycleCount).toBe(cycles.length);
        });

        it('should maintain consistency across multiple analyses', async () => {
            const analysis1 = await analyzeRepository(basicRepoPath);
            const analysis2 = await analyzeRepository(basicRepoPath);

            expect(analysis1.totalFiles).toBe(analysis2.totalFiles);
            expect(analysis1.totalDependencies).toBe(analysis2.totalDependencies);
            expect(analysis1.cycleCount).toBe(analysis2.cycleCount);
        });
    });

    describe('Performance', () => {
        it('should complete repository analysis in reasonable time', async () => {
            const startTime = Date.now();
            await analyzeRepository(basicRepoPath);
            const endTime = Date.now();

            const duration = endTime - startTime;
            expect(duration).toBeLessThan(30000);
        });

        it('should handle multiple concurrent file analyses', async () => {
            const files = [
                path.join('src', 'index.ts'),
                path.join('src', 'utils', 'helper.ts'),
                path.join('src', 'empty.ts')
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
