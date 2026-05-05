import { describe, it, expect, vi } from 'vitest';
import { detectIntent, explainRiskIntent, explainImpactIntent } from './intent-router';
import { explainRisk, explainImpact } from './explainer';
import { FileAnalysis, FileImpactResult, MetricClassification } from '../types';

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

  // Trend intent tests
  it('should detect trend intent with "trend" keyword', () => {
    expect(detectIntent('What is the trend for this file?')).toBe('fileTrend');
  });

  it('should detect trend intent with "getting worse" keyword', () => {
    expect(detectIntent('Is this file getting worse?')).toBe('fileTrend');
  });

  it('should detect trend intent with "increasing" keyword', () => {
    expect(detectIntent('Is the risk increasing?')).toBe('fileTrend');
  });

  it('should detect trend intent with "decreasing" keyword', () => {
    expect(detectIntent('Is the risk decreasing?')).toBe('fileTrend');
  });

  it('should detect trend intent with "evolving" keyword', () => {
    expect(detectIntent('How is this file evolving?')).toBe('fileTrend');
  });

  it('should detect trend intent with "evolution" keyword', () => {
    expect(detectIntent('What is the evolution of this file?')).toBe('fileTrend');
  });

  // Drift intent tests
  it('should detect drift intent with "drift" keyword', () => {
    expect(detectIntent('What is the drift in the codebase?')).toBe('driftSummary');
  });

  it('should detect drift intent with "changed" keyword', () => {
    expect(detectIntent('What has changed in the architecture?')).toBe('driftSummary');
  });

  it('should detect drift intent with "changes" keyword', () => {
    expect(detectIntent('What changes have occurred?')).toBe('driftSummary');
  });

  it('should detect drift intent with "difference" keyword', () => {
    expect(detectIntent('What is the difference between snapshots?')).toBe('driftSummary');
  });

  it('should detect drift intent with "compare" keyword', () => {
    expect(detectIntent('Compare the current state with previous')).toBe('driftSummary');
  });

  // Hotspot intent tests
  it('should detect hotspot intent with "hotspot" keyword', () => {
    expect(detectIntent('What are the hotspots?')).toBe('hotspots');
  });

  it('should detect hotspot intent with "biggest problem" keyword', () => {
    expect(detectIntent('What is the biggest problem in the codebase?')).toBe('hotspots');
  });

  it('should detect hotspot intent with "problematic" keyword', () => {
    expect(detectIntent('Which files are most problematic?')).toBe('hotspots');
  });

  it('should detect hotspot intent with "worst" keyword', () => {
    expect(detectIntent('What are the worst files?')).toBe('hotspots');
  });

  it('should detect hotspot intent with "most critical" keyword', () => {
    expect(detectIntent('What are the most critical files?')).toBe('hotspots');
  });

  // Priority tests - trend should be detected before drift, hotspot, risk, and impact
  it('should prioritize trend keywords over drift keywords', () => {
    expect(detectIntent('What is the trend of drift?')).toBe('fileTrend');
  });

  it('should prioritize trend keywords over hotspot keywords', () => {
    expect(detectIntent('What is the trend of hotspots?')).toBe('fileTrend');
  });

  it('should prioritize trend keywords over risk keywords', () => {
    expect(detectIntent('What is the risk trend?')).toBe('fileTrend');
  });

  it('should prioritize drift keywords over hotspot keywords', () => {
    expect(detectIntent('What are the drift hotspots?')).toBe('driftSummary');
  });

  it('should prioritize drift keywords over risk keywords', () => {
    expect(detectIntent('What is the risk drift?')).toBe('driftSummary');
  });

  it('should prioritize hotspot keywords over risk keywords', () => {
    expect(detectIntent('What are the risk hotspots?')).toBe('hotspots');
  });
});

describe('explainRiskIntent', () => {
  it('should call explainRisk with the provided data', async () => {
    const mockData: FileAnalysis = {
      file: 'test.ts',
      riskScore: 0.5,
      riskLevel: MetricClassification.MEDIUM,
      metrics: { centrality: 0.3, coupling: 0.4, churn: 0.2, circularDependency: 0.1 }
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
      riskLevel: MetricClassification.HIGH,
      metrics: { centrality: 0.5, coupling: 0.6, churn: 0.3, circularDependency: 0.1 }
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
