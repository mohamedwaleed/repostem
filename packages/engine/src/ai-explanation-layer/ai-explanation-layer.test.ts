import { describe, it, expect, vi, beforeEach } from 'vitest';
import { explainFileRiskUsingAI } from './ai-explaination-layer';
import { getAIService } from './ai-service-factory';
import { AIProvider } from '../types';

// Mock the AI service factory
vi.mock('./ai-service-factory', () => ({
    getAIService: vi.fn()
}));

// Mock OpenAI service
vi.mock('./providers/openai', () => ({
    OpenAIService: vi.fn().mockImplementation(() => ({
        name: 'openai',
        call: vi.fn()
    }))
}));

describe('AI Explanation Layer', () => {
    const mockGetAIService = getAIService as any;
    const mockCall = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAIService.mockReturnValue({
            name: 'openai',
            call: mockCall
        });
    });

    describe('explainFileRiskUsingAI', () => {
        it('should call AI service with correct parameters', async () => {
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.75,
                metrics: {
                    centrality: 0.8,
                    coupling: 0.6,
                    churn: 0.3
                }
            };

            mockCall.mockResolvedValue('AI explanation response');

            const result = await explainFileRiskUsingAI(fileAnalysis);

            expect(mockGetAIService).toHaveBeenCalledWith(AIProvider.OPENAI);
            expect(mockCall).toHaveBeenCalledWith(
                'gpt-4o',
                expect.stringContaining('software architecture analysis assistant'),
                expect.stringContaining('src/index.ts')
            );
            expect(result).toBe('AI explanation response');
        });

        it('should use custom model from environment variable', async () => {
            process.env.AI_MODEL = 'gpt-4-turbo';
            
            const fileAnalysis = {
                file: 'src/utils.ts',
                riskScore: 0.5,
                metrics: { centrality: 0.4, coupling: 0.3, churn: 0.2 }
            };

            mockCall.mockResolvedValue('Custom model response');

            await explainFileRiskUsingAI(fileAnalysis);

            expect(mockCall).toHaveBeenCalledWith(
                'gpt-4-turbo',
                expect.any(String),
                expect.any(String)
            );

            delete process.env.AI_MODEL;
        });

        it('should use default model when AI_MODEL is not set', async () => {
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.5,
                metrics: { centrality: 0.4, coupling: 0.3, churn: 0.2 }
            };

            mockCall.mockResolvedValue('Default model response');

            await explainFileRiskUsingAI(fileAnalysis);

            expect(mockCall).toHaveBeenCalledWith(
                'gpt-4o',
                expect.any(String),
                expect.any(String)
            );
        });

        it('should include all metrics in the prompt', async () => {
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.65,
                metrics: {
                    centrality: 0.7,
                    coupling: 0.5,
                    churn: 0.4,
                    circularDependency: 1
                }
            };

            mockCall.mockResolvedValue('Response with all metrics');

            await explainFileRiskUsingAI(fileAnalysis);

            const promptArg = mockCall.mock.calls[0][2];
            expect(promptArg).toContain('centrality: 0.7');
            expect(promptArg).toContain('coupling: 0.5');
            expect(promptArg).toContain('churn: 0.4');
            expect(promptArg).toContain('circularDependency: 1');
            expect(promptArg).toContain('Risk Score: 0.65');
        });

        it('should include file path in the prompt', async () => {
            const fileAnalysis = {
                file: 'src/components/Button.tsx',
                riskScore: 0.3,
                metrics: { centrality: 0.2, coupling: 0.1, churn: 0.05 }
            };

            mockCall.mockResolvedValue('File path included');

            await explainFileRiskUsingAI(fileAnalysis);

            const promptArg = mockCall.mock.calls[0][2];
            expect(promptArg).toContain('src/components/Button.tsx');
        });

        it('should handle empty metrics object', async () => {
            const fileAnalysis = {
                file: 'src/empty.ts',
                riskScore: 0,
                metrics: {}
            };

            mockCall.mockResolvedValue('Empty metrics response');

            const result = await explainFileRiskUsingAI(fileAnalysis);

            expect(result).toBe('Empty metrics response');
            expect(mockCall).toHaveBeenCalled();
        });

        it('should propagate AI service errors', async () => {
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.5,
                metrics: { centrality: 0.4, coupling: 0.3, churn: 0.2 }
            };

            mockCall.mockRejectedValue(new Error('AI service error'));

            await expect(explainFileRiskUsingAI(fileAnalysis)).rejects.toThrow('AI service error');
        });

        it('should handle numeric metric values correctly', async () => {
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.123456,
                metrics: {
                    centrality: 0.987654,
                    coupling: 0.555555,
                    churn: 0.111111
                }
            };

            mockCall.mockResolvedValue('Numeric values response');

            await explainFileRiskUsingAI(fileAnalysis);

            const promptArg = mockCall.mock.calls[0][2];
            expect(promptArg).toContain('centrality: 0.987654');
            expect(promptArg).toContain('coupling: 0.555555');
            expect(promptArg).toContain('churn: 0.111111');
            expect(promptArg).toContain('Risk Score: 0.123456');
        });

        it('should include system prompt with architectural analysis instructions', async () => {
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.5,
                metrics: { centrality: 0.4, coupling: 0.3, churn: 0.2 }
            };

            mockCall.mockResolvedValue('System prompt response');

            await explainFileRiskUsingAI(fileAnalysis);

            const systemPromptArg = mockCall.mock.calls[0][1];
            expect(systemPromptArg).toContain('software architecture analysis assistant');
            expect(systemPromptArg).toContain('structural risk');
            expect(systemPromptArg).toContain('Do not invent facts');
        });

        it('should return AI response as-is', async () => {
            const aiResponse = 'This file has high centrality and moderate risk due to its central position in the dependency graph.';
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.7,
                metrics: { centrality: 0.8, coupling: 0.5, churn: 0.3 }
            };

            mockCall.mockResolvedValue(aiResponse);

            const result = await explainFileRiskUsingAI(fileAnalysis);

            expect(result).toBe(aiResponse);
        });
    });

    describe('AI Service Factory', () => {
        it('should return AI service for valid provider', () => {
            mockGetAIService.mockReturnValue({
                name: 'openai',
                call: vi.fn()
            });

            const service = getAIService(AIProvider.OPENAI);

            expect(service).toBeDefined();
            expect(service.name).toBe('openai');
            expect(typeof service.call).toBe('function');
        });

        it('should throw error for invalid provider', () => {
            mockGetAIService.mockImplementation(() => {
                throw new Error('AI service invalid not found');
            });

            expect(() => getAIService('invalid' as AIProvider)).toThrow('AI service invalid not found');
        });
    });

    describe('Prompt Building', () => {
        it('should build prompt with structural metrics section', async () => {
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.6,
                metrics: {
                    centrality: 0.7,
                    coupling: 0.4,
                    churn: 0.2
                }
            };

            mockCall.mockResolvedValue('Prompt structure response');

            await explainFileRiskUsingAI(fileAnalysis);

            const promptArg = mockCall.mock.calls[0][2];
            expect(promptArg).toContain('Structural Metrics:');
        });

        it('should build prompt with explanation request', async () => {
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.5,
                metrics: { centrality: 0.4, coupling: 0.3, churn: 0.2 }
            };

            mockCall.mockResolvedValue('Explanation request response');

            await explainFileRiskUsingAI(fileAnalysis);

            const promptArg = mockCall.mock.calls[0][2];
            expect(promptArg).toContain('Explain:');
            expect(promptArg).toContain('What these metrics imply structurally');
            expect(promptArg).toContain('Why the file may be considered low/moderate/high risk');
            expect(promptArg).toContain('architectural concerns');
        });

        it('should format metrics as key-value pairs with dashes', async () => {
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.5,
                metrics: {
                    metric1: 0.1,
                    metric2: 0.2,
                    metric3: 0.3
                }
            };

            mockCall.mockResolvedValue('Formatted metrics response');

            await explainFileRiskUsingAI(fileAnalysis);

            const promptArg = mockCall.mock.calls[0][2];
            expect(promptArg).toContain('- metric1: 0.1');
            expect(promptArg).toContain('- metric2: 0.2');
            expect(promptArg).toContain('- metric3: 0.3');
        });
    });

    describe('Environment Configuration', () => {
        it('should use custom AI provider from environment variable', async () => {
            process.env.AI_PROVIDER = 'openai';
            
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.5,
                metrics: { centrality: 0.4, coupling: 0.3, churn: 0.2 }
            };

            mockCall.mockResolvedValue('Custom provider response');

            await explainFileRiskUsingAI(fileAnalysis);

            expect(mockGetAIService).toHaveBeenCalledWith('openai');

            delete process.env.AI_PROVIDER;
        });

        it('should default to openai provider when AI_PROVIDER is not set', async () => {
            const fileAnalysis = {
                file: 'src/index.ts',
                riskScore: 0.5,
                metrics: { centrality: 0.4, coupling: 0.3, churn: 0.2 }
            };

            mockCall.mockResolvedValue('Default provider response');

            await explainFileRiskUsingAI(fileAnalysis);

            expect(mockGetAIService).toHaveBeenCalledWith(AIProvider.OPENAI);
        });
    });
});
