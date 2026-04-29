import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSnapshotHistory } from './history-service';
import type { RepoStemConfig, StorageType } from '../types';

// Mock database adapters
vi.mock('../persistence/adapters', () => ({
    AdapterFactory: {
        createAdapterFromString: vi.fn(() => ({
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn().mockResolvedValue(undefined),
            getKnex: vi.fn(),
            runMigration: vi.fn(),
            query: vi.fn(),
            execute: vi.fn(),
            tableExists: vi.fn(),
        }))
    }
}));

// Mock repositories
const mockSnapshots = [
    {
        id: 'snapshot-1',
        repo_id: 'repo-123',
        git_remote_url: 'https://github.com/test/repo',
        branch: 'main',
        commit_hash: 'abc123',
        working_tree_dirty: false,
        total_files: 100,
        cycle_count: 2,
        created_at: new Date('2024-01-01')
    },
    {
        id: 'snapshot-2',
        repo_id: 'repo-123',
        git_remote_url: 'https://github.com/test/repo',
        branch: 'main',
        commit_hash: 'def456',
        working_tree_dirty: false,
        total_files: 105,
        cycle_count: 1,
        created_at: new Date('2024-01-02')
    }
];

vi.mock('../persistence/repositories', () => ({
    SnapshotRepository: class {
        constructor(_adapter: any) {}
        async getSnapshotsByRepoId(_repoId: string) {
            return mockSnapshots;
        }
        async getSnapshotsByBranch(_repoId: string, _branch: string) {
            return mockSnapshots.filter(s => s.branch === _branch);
        }
    }
}));

// Mock git utility
vi.mock('../utils/git', () => ({
    detectBranch: vi.fn(() => Promise.resolve('main'))
}));

// Mock config functions
const mockConfig: RepoStemConfig = {
    repo_id: 'repo-123',
    storage_type: 'sqlite' as StorageType,
    storage_path: '/tmp/test.db'
};

vi.mock('../config/config-loader', () => ({
    checkConfigFile: vi.fn(() => true),
    getConfig: vi.fn(() => ({ ...mockConfig }))
}));

describe('HistoryService - getSnapshotHistory', () => {
    beforeEach(() => {
        mockConfig.repo_id = 'repo-123';
        mockConfig.storage_type = 'sqlite';
        mockConfig.storage_path = '/tmp/test.db';
    });

    describe('Error Handling', () => {
        it('should throw error when config file is missing', async () => {
            const { checkConfigFile } = await import('../config/config-loader');
            vi.mocked(checkConfigFile).mockReturnValueOnce(false);

            await expect(
                getSnapshotHistory({ repo: '/tmp/test-repo' })
            ).rejects.toThrow(/No .repostem.json found in this repository/);
        });

        it('should throw error when config file is missing with default repo', async () => {
            const { checkConfigFile } = await import('../config/config-loader');
            vi.mocked(checkConfigFile).mockReturnValueOnce(false);

            await expect(
                getSnapshotHistory({})
            ).rejects.toThrow(/No .repostem.json found in this repository/);
        });

        it('should throw error when repo_id is missing', async () => {
            const { getConfig } = await import('../config/config-loader');
            mockConfig.repo_id = undefined;
            vi.mocked(getConfig).mockReturnValueOnce({ ...mockConfig });

            await expect(
                getSnapshotHistory({ repo: '/tmp/test-repo' })
            ).rejects.toThrow(/missing repo_id/);
        });

        it('should throw error when storage_type is missing', async () => {
            const { getConfig } = await import('../config/config-loader');
            mockConfig.storage_type = undefined;
            vi.mocked(getConfig).mockReturnValueOnce({ ...mockConfig });

            await expect(
                getSnapshotHistory({ repo: '/tmp/test-repo' })
            ).rejects.toThrow(/missing repo_id \/ storage_type \/ storage_path/);
        });

        it('should throw error when storage_path is missing', async () => {
            const { getConfig } = await import('../config/config-loader');
            mockConfig.storage_path = undefined;
            vi.mocked(getConfig).mockReturnValueOnce({ ...mockConfig });

            await expect(
                getSnapshotHistory({ repo: '/tmp/test-repo' })
            ).rejects.toThrow(/missing repo_id \/ storage_type \/ storage_path/);
        });
    });

    describe('Successful Retrieval', () => {
        it('should return snapshots for all branches when no filter is applied', async () => {
            const { detectBranch } = await import('../utils/git');
            vi.mocked(detectBranch).mockResolvedValueOnce(null);

            const result = await getSnapshotHistory({ repo: '/tmp/test-repo' });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });

        it('should return snapshots for detected branch', async () => {
            const result = await getSnapshotHistory({ repo: '/tmp/test-repo' });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result.every(s => s.branch === 'main')).toBe(true);
        });

        it('should return snapshots for explicitly specified branch', async () => {
            const result = await getSnapshotHistory({ 
                repo: '/tmp/test-repo',
                branch: 'main'
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result.every(s => s.branch === 'main')).toBe(true);
        });

        it('should return all snapshots when noBranchFilter is true', async () => {
            const result = await getSnapshotHistory({ 
                repo: '/tmp/test-repo',
                noBranchFilter: true
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });

        it('should use default repo path when not specified', async () => {
            const result = await getSnapshotHistory({});

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
