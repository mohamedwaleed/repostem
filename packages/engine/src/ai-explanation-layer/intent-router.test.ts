import { describe, it, expect, vi } from 'vitest';
import { detectIntent, explainRiskIntent, explainImpactIntent } from './intent-router';
import { explainRisk, explainImpact } from './explainer';
import { FileAnalysis, FileImpactResult } from '../types';

// Mock the explainer functions
vi.mock('./explainer', () => ({
  explainRisk: vi.fn(),
  explainImpact: vi.fn()
}));

describe('detectIntent', () => {
  it('should detect risk intent with "risk" keyword', () => {
    expect(detectIntent('What is the risk of this file?')).toBe('risk');
  });

  it('should detect risk intent with "risks" keyword', () => {
    expect(detectIntent('What are the risks involved?')).toBe('risk');
  });

  it('should detect risk intent with "threat" keyword', () => {
    expect(detectIntent('Is there a threat here?')).toBe('risk');
  });

  it('should detect risk intent with "threats" keyword', () => {
    expect(detectIntent('What are the threats?')).toBe('risk');
  });

  it('should detect risk intent with "danger" keyword', () => {
    expect(detectIntent('Is this code dangerous?')).toBe('risk');
  });

  it('should detect risk intent with "hazard" keyword', () => {
    expect(detectIntent('Are there any hazards?')).toBe('risk');
  });

  it('should detect risk intent with "fragile" keyword', () => {
    expect(detectIntent('Is this module fragile?')).toBe('risk');
  });

  it('should detect impact intent with "impact" keyword', () => {
    expect(detectIntent('What is the impact of this change?')).toBe('impact');
  });

  it('should detect impact intent with "impacts" keyword', () => {
    expect(detectIntent('What are the impacts?')).toBe('impact');
  });

  it('should detect impact intent with "consequence" keyword', () => {
    expect(detectIntent('What are the consequences?')).toBe('impact');
  });

  it('should detect impact intent with "consequences" keyword', () => {
    expect(detectIntent('What consequences will this have?')).toBe('impact');
  });

  it('should detect impact intent with "effect" keyword', () => {
    expect(detectIntent('What is the effect?')).toBe('impact');
  });

  it('should detect impact intent with "effects" keyword', () => {
    expect(detectIntent('What are the effects?')).toBe('impact');
  });

  it('should detect impact intent with "result" keyword', () => {
    expect(detectIntent('What is the result?')).toBe('impact');
  });

  it('should detect impact intent with "results" keyword', () => {
    expect(detectIntent('What are the results?')).toBe('impact');
  });

  it('should return unknown for questions without keywords', () => {
    expect(detectIntent('How does this work?')).toBe('unknown');
  });

  it('should be case insensitive for risk keywords', () => {
    expect(detectIntent('RISK analysis needed')).toBe('risk');
    expect(detectIntent('Risk Analysis Needed')).toBe('risk');
    expect(detectIntent('RISK ANALYSIS NEEDED')).toBe('risk');
  });

  it('should be case insensitive for impact keywords', () => {
    expect(detectIntent('IMPACT analysis needed')).toBe('impact');
    expect(detectIntent('Impact Analysis Needed')).toBe('impact');
    expect(detectIntent('IMPACT ANALYSIS NEEDED')).toBe('impact');
  });

  it('should prioritize risk keywords over impact keywords when both present', () => {
    expect(detectIntent('What is the risk and impact?')).toBe('risk');
  });

  it('should handle empty string', () => {
    expect(detectIntent('')).toBe('unknown');
  });

  it('should handle strings with only whitespace', () => {
    expect(detectIntent('   ')).toBe('unknown');
  });

  it('should detect risk when keyword is part of a larger word', () => {
    expect(detectIntent('What are the risk factors?')).toBe('risk');
  });

  it('should detect impact when keyword is part of a larger word', () => {
    expect(detectIntent('What is the impact analysis?')).toBe('impact');
  });
});

describe('explainRiskIntent', () => {
  it('should call explainRisk with the provided data', async () => {
    const mockData: FileAnalysis = {
      file: 'test.ts',
      riskScore: 0.5,
      metrics: { centrality: 0.3, coupling: 0.4, churn: 0.2 }
    };
    
    vi.mocked(explainRisk).mockResolvedValue('Risk explanation');
    
    const result = await explainRiskIntent(mockData);
    
    expect(explainRisk).toHaveBeenCalledWith(mockData);
    expect(result).toBe('Risk explanation');
  });

  it('should return the result from explainRisk', async () => {
    const mockData: FileAnalysis = {
      file: 'test.ts',
      riskScore: 0.7,
      metrics: { centrality: 0.5, coupling: 0.6, churn: 0.3 }
    };
    
    vi.mocked(explainRisk).mockResolvedValue('High risk explanation');
    
    const result = await explainRiskIntent(mockData);
    
    expect(result).toBe('High risk explanation');
  });
});

describe('explainImpactIntent', () => {
  it('should call explainImpact with the provided data', async () => {
    const mockData: FileImpactResult = {
      file: 'test.ts',
      directDependents: ['a.ts', 'b.ts'],
      transitiveDependents: ['c.ts', 'd.ts', 'e.ts'],
      totalImpactCount: 5,
      impactRatio: 0.8
    };
    
    vi.mocked(explainImpact).mockResolvedValue('Impact explanation');
    
    const result = await explainImpactIntent(mockData);
    
    expect(explainImpact).toHaveBeenCalledWith(mockData);
    expect(result).toBe('Impact explanation');
  });

  it('should return the result from explainImpact', async () => {
    const mockData: FileImpactResult = {
      file: 'test.ts',
      directDependents: ['a.ts'],
      transitiveDependents: ['b.ts', 'c.ts'],
      totalImpactCount: 3,
      impactRatio: 0.5
    };
    
    vi.mocked(explainImpact).mockResolvedValue('Moderate impact explanation');
    
    const result = await explainImpactIntent(mockData);
    
    expect(result).toBe('Moderate impact explanation');
  });
});
