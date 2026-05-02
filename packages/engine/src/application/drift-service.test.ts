import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectDrift } from './drift-service';

// Mock dependencies
vi.mock('../utils/service-context', () => ({
    withServiceContext: vi.fn(async (_options: any, operation: any) => {
        return operation({
            repoPath: '/tmp/test-repo',
            config: {
                repo_id: 'test-repo',
                storage_type: 'sqlite',
                storage_path: ':memory:'
            },
            repo: {
                getSnapshotsByRepoId: vi.fn().mockResolvedValue([]),
                getSnapshotsByBranch: vi.fn().mockResolvedValue([]),
                getRecentSnapshots: vi.fn().mockResolvedValue([])
            },
            adapter: {
                getKnex: vi.fn()
            },
            branch: undefined
        });
    })
}));

describe('DriftService - detectDrift', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should throw error when not enough snapshots exist', async () => {
        await expect(
            detectDrift({ repo: '/tmp/test-repo' })
        ).rejects.toThrow(/Not enough snapshots to detect drift/);
    });
});
