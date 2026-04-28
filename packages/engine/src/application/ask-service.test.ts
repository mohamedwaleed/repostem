import { describe, it, expect, vi } from 'vitest';
import { ask } from './ask-service';

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
            return path === 'src/index.ts' || path === 'src/utils/helper.ts';
        }),
        getNodes: vi.fn(() => new Set(['src/index.ts', 'src/utils/helper.ts'])),
        getEdges: vi.fn(() => new Map()),
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
    computeMetrics: vi.fn().mockResolvedValue(new Map())
}));

// Mock risk engine
vi.mock('../core/risk-engine/risk-engine', () => ({
    computeFileRisk: vi.fn(() => ({
        file: 'src/index.ts',
        riskScore: 0.35,
        riskLevel: 'MEDIUM'
    })),
    computeRisk: vi.fn(() => [])
}));

// Mock impact engine
vi.mock('../core/impact-engine/impact-engine', () => ({
    computeImpact: vi.fn(() => ({
        file: 'src/utils/helper.ts',
        directDependents: ['src/index.ts'],
        transitiveDependents: ['src/index.ts'],
        totalImpactCount: 1
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

const basicRepoPath = '/tmp/test-repo';

describe('AskService - ask', () => {
    describe('Question Parsing', () => {
        it('should extract file path from question', async () => {
            const question = "What is the risk of src/index.ts?";
            const result = await ask(question, basicRepoPath);

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should handle different file path formats', async () => {
            const questions = [
                "Explain the risk of src/utils/helper.ts",
                "What is the impact of src/index.ts?"
            ];

            for (const question of questions) {
                const result = await ask(question, basicRepoPath);
                expect(typeof result).toBe('string');
            }
        });

        it('should throw error when no file path found in question', async () => {
            const question = "What is the architecture of this project?";

            await expect(
                ask(question, basicRepoPath)
            ).rejects.toThrow(/No file path found/i);
        });

        it('should throw error for unknown intent', async () => {
            const question = "Show me the content of src/index.ts";

            await expect(
                ask(question, basicRepoPath)
            ).rejects.toThrow(/Unknown question/i);
        });
    });

    describe('Intent Detection', () => {
        it('should detect risk intent from question', async () => {
            const question = "What is the risk of src/index.ts?";
            const result = await ask(question, basicRepoPath);

            expect(result).toContain('AI explanation');
            expect(result).toContain('risk score');
        });

        it('should detect impact intent from question', async () => {
            const question = "What is the impact of src/utils/helper.ts?";
            const result = await ask(question, basicRepoPath);

            expect(result).toContain('AI impact explanation');
        });

        it('should route to correct explanation based on intent', async () => {
            const riskQuestion = "What is the risk of src/index.ts?";
            const impactQuestion = "What is the impact of src/utils/helper.ts?";

            const riskResult = await ask(riskQuestion, basicRepoPath);
            const impactResult = await ask(impactQuestion, basicRepoPath);

            expect(riskResult).toContain('risk score');
            expect(impactResult).toContain('impact');
        });
    });

    describe('Error Handling', () => {
        it('should throw error for non-existent file', async () => {
            const question = "What is the risk of src/non-existent-file.ts?";

            await expect(
                ask(question, basicRepoPath)
            ).rejects.toThrow();
        });

        it('should throw descriptive error for missing file', async () => {
            const question = "What is the risk of src/missing.ts?";

            await expect(
                ask(question, basicRepoPath)
            ).rejects.toThrow(/not found/i);
        });

        it('should handle empty question gracefully', async () => {
            const question = "";

            await expect(
                ask(question, basicRepoPath)
            ).rejects.toThrow();
        });
    });

    describe('File Path Extraction', () => {
        it('should extract file paths with various extensions', async () => {
            const extensions = ['.ts', '.tsx', '.js', '.jsx'];
            
            for (const ext of extensions) {
                const question = `What is the risk of src/file${ext}?`;
                try {
                    await ask(question, basicRepoPath);
                } catch (error: any) {
                    // File doesn't exist, but we're testing path extraction
                    expect(error.message).not.toContain('No file path found');
                }
            }
        });

        it('should extract nested file paths', async () => {
            const question = "What is the risk of src/utils/helpers/format.ts?";
            
            try {
                await ask(question, basicRepoPath);
            } catch (error: any) {
                expect(error.message).not.toContain('No file path found');
            }
        });

        it('should extract file paths with hyphens and underscores', async () => {
            const question = "What is the risk of src/utils/my-helper_file.ts?";
            
            try {
                await ask(question, basicRepoPath);
            } catch (error: any) {
                expect(error.message).not.toContain('No file path found');
            }
        });
    });
});
