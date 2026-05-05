import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateHotspotTrends } from './hotspot-trend-service';
import type { HotspotTrendItem } from '../types';

// Mock dependencies
vi.mock('../utils/service-context', () => ({
    withServiceContext: vi.fn()
}));

vi.mock('../persistence/repositories', () => ({
    FileSnapshotRepository: vi.fn(),
    EdgeRepository: vi.fn(),
    CycleRepository: vi.fn()
}));

vi.mock('../persistence/snapshot-reconstructor', () => ({
    reconstructSnapshot: vi.fn()
}));

vi.mock('../core/hostspot-engine/hotspot-trend-engine', () => ({
    computeHotspotTrends: vi.fn()
}));

describe('HotspotTrendService - calculateHotspotTrends', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Error Handling', () => {
        it('should throw error when not enough snapshots exist (default behavior)', async () => {
            const { withServiceContext } = await import('../utils/service-context');
            vi.mocked(withServiceContext).mockImplementation(async (_options: any, operation: any) => {
                return operation({
                    repoPath: '/tmp/test-repo',
                    config: {
                        repo_id: 'test-repo',
                        storage_type: 'sqlite',
                        storage_path: ':memory:'
                    },
                    repo: {
                        getSnapshotsByBranch: vi.fn().mockResolvedValue([])
                    },
                    adapter: {
                        getKnex: vi.fn()
                    },
                    branch: 'main'
                });
            });

            await expect(
                calculateHotspotTrends({ repo: '/tmp/test-repo' })
            ).rejects.toThrow(/Not enough snapshots to calculate trends/);
        });

        it('should throw error when only one snapshot exists', async () => {
            const { withServiceContext } = await import('../utils/service-context');
            vi.mocked(withServiceContext).mockImplementation(async (_options: any, operation: any) => {
                return operation({
                    repoPath: '/tmp/test-repo',
                    config: {
                        repo_id: 'test-repo',
                        storage_type: 'sqlite',
                        storage_path: ':memory:'
                    },
                    repo: {
                        getSnapshotsByBranch: vi.fn().mockResolvedValue([
                            { id: 'snapshot-1' }
                        ])
                    },
                    adapter: {
                        getKnex: vi.fn()
                    },
                    branch: 'main'
                });
            });

            await expect(
                calculateHotspotTrends({ repo: '/tmp/test-repo' })
            ).rejects.toThrow(/Not enough snapshots to calculate trends/);
        });

        it('should throw error when --since snapshot not found', async () => {
            const { withServiceContext } = await import('../utils/service-context');
            vi.mocked(withServiceContext).mockImplementation(async (_options: any, operation: any) => {
                return operation({
                    repoPath: '/tmp/test-repo',
                    config: {
                        repo_id: 'test-repo',
                        storage_type: 'sqlite',
                        storage_path: ':memory:'
                    },
                    repo: {
                        getSnapshotByBranchAndId: vi.fn().mockResolvedValue(null),
                        getSnapshotsByBranch: vi.fn().mockResolvedValue([
                            { id: 'snapshot-1' }
                        ])
                    },
                    adapter: {
                        getKnex: vi.fn()
                    },
                    branch: 'main'
                });
            });

            await expect(
                calculateHotspotTrends({ repo: '/tmp/test-repo', since: 'non-existent-id' })
            ).rejects.toThrow(/Not enough snapshots to calculate trends/);
        });

        it('should throw error when latest snapshot not found with --since', async () => {
            const { withServiceContext } = await import('../utils/service-context');
            vi.mocked(withServiceContext).mockImplementation(async (_options: any, operation: any) => {
                return operation({
                    repoPath: '/tmp/test-repo',
                    config: {
                        repo_id: 'test-repo',
                        storage_type: 'sqlite',
                        storage_path: ':memory:'
                    },
                    repo: {
                        getSnapshotByBranchAndId: vi.fn().mockResolvedValue({ id: 'snapshot-1' }),
                        getSnapshotsByBranch: vi.fn().mockResolvedValue([])
                    },
                    adapter: {
                        getKnex: vi.fn()
                    },
                    branch: 'main'
                });
            });

            await expect(
                calculateHotspotTrends({ repo: '/tmp/test-repo', since: 'snapshot-1' })
            ).rejects.toThrow(/Not enough snapshots to calculate trends/);
        });
    });

    describe('Successful Retrieval', () => {
        it('should calculate trends using last 2 snapshots by default', async () => {
            const mockSnapshots = [
                { id: 'snapshot-1' },
                { id: 'snapshot-2' }
            ];
            const mockTrends: HotspotTrendItem[] = [
                {
                    file: 'test.ts',
                    previousRiskScore: 0.1,
                    currentRiskScore: 0.2,
                    riskDelta: 0.1,
                    previousImpactRatio: 0.5,
                    currentImpactRatio: 0.6,
                    impactDelta: 0.1,
                    trendScore: 0.1
                }
            ];

            const { withServiceContext } = await import('../utils/service-context');
            vi.mocked(withServiceContext).mockImplementation(async (_options: any, operation: any) => {
                return operation({
                    repoPath: '/tmp/test-repo',
                    config: {
                        repo_id: 'test-repo',
                        storage_type: 'sqlite',
                        storage_path: ':memory:'
                    },
                    repo: {
                        getSnapshotsByBranch: vi.fn().mockResolvedValue(mockSnapshots)
                    },
                    adapter: {
                        getKnex: vi.fn()
                    },
                    branch: 'main'
                });
            });

            const { reconstructSnapshot } = await import('../persistence/snapshot-reconstructor');
            const { computeHotspotTrends: computeTrends } = await import('../core/hostspot-engine/hotspot-trend-engine');

            vi.mocked(reconstructSnapshot).mockResolvedValue({} as any);
            vi.mocked(computeTrends).mockReturnValueOnce(mockTrends);

            const result = await calculateHotspotTrends({ repo: '/tmp/test-repo' });

            expect(result).toEqual(mockTrends);
            expect(reconstructSnapshot).toHaveBeenCalledTimes(2);
            expect(computeTrends).toHaveBeenCalledTimes(1);
        });

        it('should calculate trends using --since option', async () => {
            const mockSinceSnapshot = { id: 'snapshot-1' };
            const mockLatestSnapshot = { id: 'snapshot-2' };
            const mockTrends: HotspotTrendItem[] = [
                {
                    file: 'test.ts',
                    previousRiskScore: 0.1,
                    currentRiskScore: 0.2,
                    riskDelta: 0.1,
                    previousImpactRatio: 0.5,
                    currentImpactRatio: 0.6,
                    impactDelta: 0.1,
                    trendScore: 0.1
                }
            ];

            const { withServiceContext } = await import('../utils/service-context');
            vi.mocked(withServiceContext).mockImplementation(async (_options: any, operation: any) => {
                return operation({
                    repoPath: '/tmp/test-repo',
                    config: {
                        repo_id: 'test-repo',
                        storage_type: 'sqlite',
                        storage_path: ':memory:'
                    },
                    repo: {
                        getSnapshotByBranchAndId: vi.fn().mockResolvedValue(mockSinceSnapshot),
                        getSnapshotsByBranch: vi.fn().mockResolvedValue([mockLatestSnapshot])
                    },
                    adapter: {
                        getKnex: vi.fn()
                    },
                    branch: 'main'
                });
            });

            const { reconstructSnapshot } = await import('../persistence/snapshot-reconstructor');
            const { computeHotspotTrends: computeTrends } = await import('../core/hostspot-engine/hotspot-trend-engine');

            vi.mocked(reconstructSnapshot).mockResolvedValue({} as any);
            vi.mocked(computeTrends).mockReturnValueOnce(mockTrends);

            const result = await calculateHotspotTrends({ repo: '/tmp/test-repo', since: 'snapshot-1' });

            expect(result).toEqual(mockTrends);
            expect(reconstructSnapshot).toHaveBeenCalledTimes(2);
            expect(computeTrends).toHaveBeenCalledTimes(1);
        });

        it('should use getRecentSnapshots when no branch is detected', async () => {
            const { withServiceContext } = await import('../utils/service-context');
            vi.mocked(withServiceContext).mockImplementation(async (_options: any, operation: any) => {
                return operation({
                    repoPath: '/tmp/test-repo',
                    config: {
                        repo_id: 'test-repo',
                        storage_type: 'sqlite',
                        storage_path: ':memory:'
                    },
                    repo: {
                        getRecentSnapshots: vi.fn().mockResolvedValue([
                            { id: 'snapshot-1' },
                            { id: 'snapshot-2' }
                        ])
                    },
                    adapter: {
                        getKnex: vi.fn()
                    },
                    branch: undefined
                });
            });

            const { reconstructSnapshot } = await import('../persistence/snapshot-reconstructor');
            const { computeHotspotTrends: computeTrends } = await import('../core/hostspot-engine/hotspot-trend-engine');

            vi.mocked(reconstructSnapshot).mockResolvedValue({} as any);
            vi.mocked(computeTrends).mockReturnValueOnce([]);

            const result = await calculateHotspotTrends({ repo: '/tmp/test-repo', noBranchFilter: true });

            expect(result).toEqual([]);
        });

        it('should pass trendThreshold and limit to computeHotspotTrends', async () => {
            const mockSnapshots = [
                { id: 'snapshot-1' },
                { id: 'snapshot-2' }
            ];

            const { withServiceContext } = await import('../utils/service-context');
            vi.mocked(withServiceContext).mockImplementation(async (_options: any, operation: any) => {
                return operation({
                    repoPath: '/tmp/test-repo',
                    config: {
                        repo_id: 'test-repo',
                        storage_type: 'sqlite',
                        storage_path: ':memory:'
                    },
                    repo: {
                        getSnapshotsByBranch: vi.fn().mockResolvedValue(mockSnapshots)
                    },
                    adapter: {
                        getKnex: vi.fn()
                    },
                    branch: 'main'
                });
            });

            const { reconstructSnapshot } = await import('../persistence/snapshot-reconstructor');
            const { computeHotspotTrends: computeTrends } = await import('../core/hostspot-engine/hotspot-trend-engine');

            vi.mocked(reconstructSnapshot).mockResolvedValue({} as any);
            vi.mocked(computeTrends).mockReturnValueOnce([]);

            await calculateHotspotTrends({ repo: '/tmp/test-repo' }, 0.1, 10);

            expect(computeTrends).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(Object),
                0.1,
                10
            );
        });

        it('should use getSnapshotById when branch is undefined with --since', async () => {
            const { withServiceContext } = await import('../utils/service-context');
            vi.mocked(withServiceContext).mockImplementation(async (_options: any, operation: any) => {
                return operation({
                    repoPath: '/tmp/test-repo',
                    config: {
                        repo_id: 'test-repo',
                        storage_type: 'sqlite',
                        storage_path: ':memory:'
                    },
                    repo: {
                        getSnapshotById: vi.fn().mockResolvedValue({ id: 'snapshot-1' }),
                        getRecentSnapshots: vi.fn().mockResolvedValue([{ id: 'snapshot-2' }])
                    },
                    adapter: {
                        getKnex: vi.fn()
                    },
                    branch: undefined
                });
            });

            const { reconstructSnapshot } = await import('../persistence/snapshot-reconstructor');
            const { computeHotspotTrends: computeTrends } = await import('../core/hostspot-engine/hotspot-trend-engine');

            vi.mocked(reconstructSnapshot).mockResolvedValue({} as any);
            vi.mocked(computeTrends).mockReturnValueOnce([]);

            const result = await calculateHotspotTrends({ 
                repo: '/tmp/test-repo', 
                since: 'snapshot-1',
                noBranchFilter: true
            });

            expect(result).toEqual([]);
        });
    });
});
