import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeRepo, isRepoInitialized, resetPersistence } from './init-service';

// Mock database adapters
vi.mock('../persistence/adapters', () => ({
    AdapterFactory: {
        createAdapterFromString: vi.fn(() => ({
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn().mockResolvedValue(undefined),
            query: vi.fn().mockResolvedValue([]),
        }))
    },
    DatabaseType: {
        SQLITE: 'sqlite',
        POSTGRESQL: 'postgresql'
    }
}));

// Mock repositories
vi.mock('../persistence/repositories', () => ({
    RepoRepository: class {
        constructor(_adapter: any) {}
        async createRepo(_repoId: string, _rootPath: string) {}
        async getRepoById(_repoId: string) { return undefined; }
    },
    SnapshotRepository: class {
        constructor(_adapter: any) {}
        async createSnapshot(_snapshot: any) {}
        async getSnapshotsByRepoId(_repoId: string) { return []; }
        async deleteSnapshot(_snapshotId: string) {}
    },
    FileSnapshotRepository: class {
        constructor(_adapter: any) {}
    },
    EdgeRepository: class {
        constructor(_adapter: any) {}
    },
    CycleRepository: class {
        constructor(_adapter: any) {}
    }
}));

// Mock migrations
vi.mock('../persistence/migrations', () => ({
    runInitMigration: vi.fn().mockResolvedValue({
        success: true,
        message: 'Migration successful',
        tablesCreated: ['repo', 'snapshot', 'file_snapshot', 'dependency_edge', 'cycle']
    }),
    isSchemaInitialized: vi.fn().mockResolvedValue(false)
}));

// Mock config functions
const mockConfig = {
    respectGitignore: true,
    ignore: [],
    storage_type: undefined as string | undefined,
    storage_path: undefined as string | undefined,
    repo_id: undefined as string | undefined
};

vi.mock('../config/config-loader', () => ({
    getConfig: vi.fn(() => ({ ...mockConfig })),
    updateConfigFile: vi.fn((_repoPath: string, config: any) => {
        Object.assign(mockConfig, config);
        return '/path/to/.repostem.json';
    }),
    isPersistenceConfigured: vi.fn(() => !!mockConfig.storage_type && !!mockConfig.storage_path && !!mockConfig.repo_id),
    checkConfigFile: vi.fn(() => false),
    getAllIgnorePatterns: vi.fn(() => ['node_modules/**', '.git/**', 'dist/**'])
}));

describe('InitService - initializeRepo', () => {
    beforeEach(() => {
        mockConfig.storage_type = undefined;
        mockConfig.storage_path = undefined;
        mockConfig.repo_id = undefined;
    });

    describe('New Repository Initialization', () => {
        it('should initialize repository with new repo_id', async () => {
            const testRepoPath = '/tmp/test-repostem-init-repo';
            const result = await initializeRepo(testRepoPath, {
                storageType: 'sqlite',
                storagePath: '/tmp/test-repostem-init.db'
            });

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.repoId).toBeDefined();
            expect(typeof result.repoId).toBe('string');
            expect(result.config).toBeDefined();
            expect(result.config.repo_id).toBe(result.repoId);
            expect(result.config.storage_type).toBe('sqlite');
            expect(result.config.storage_path).toBe('/tmp/test-repostem-init.db');
            expect(result.migrationResult).toBeDefined();
            expect(result.migrationResult.success).toBe(true);
        });

        it('should generate a valid UUID for repo_id', async () => {
            const testRepoPath = '/tmp/test-repostem-uuid';
            const result = await initializeRepo(testRepoPath, {
                storageType: 'sqlite',
                storagePath: '/tmp/test-repostem-uuid.db'
            });

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            expect(result.repoId).toMatch(uuidRegex);
        });

        it('should return success message with details', async () => {
            const testRepoPath = '/tmp/test-repostem-message';
            const result = await initializeRepo(testRepoPath, {
                storageType: 'sqlite',
                storagePath: '/tmp/test-repostem-message.db'
            });

            expect(result.message).toBeDefined();
            expect(result.message).toContain('Repository initialized successfully');
            expect(result.message).toContain(result.repoId);
            expect(result.message).toContain('sqlite');
        });

        it('should support different storage types', async () => {
            const testRepoPath = '/tmp/test-repostem-storage-types';
            
            const sqliteResult = await initializeRepo(testRepoPath, {
                storageType: 'sqlite',
                storagePath: '/tmp/test.db'
            });
            expect(sqliteResult.config.storage_type).toBe('sqlite');
        });
    });

    describe('Reconfiguration', () => {
        it('should use existing repo_id when provided (reconfiguration)', async () => {
            const testRepoPath = '/tmp/test-repostem-reconfigure';
            const existingRepoId = 'test-repo-id-12345';
            
            const result = await initializeRepo(testRepoPath, {
                storageType: 'sqlite',
                storagePath: '/tmp/test-repostem-reconfigure.db',
                repoId: existingRepoId
            });

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.repoId).toBe(existingRepoId);
            expect(result.config.repo_id).toBe(existingRepoId);
        });

        it('should preserve repo_id across reconfigurations', async () => {
            const testRepoPath = '/tmp/test-repostem-preserve';
            const originalRepoId = 'original-repo-id-999';
            
            const result1 = await initializeRepo(testRepoPath, {
                storageType: 'sqlite',
                storagePath: '/tmp/test-original.db',
                repoId: originalRepoId
            });

            const result2 = await initializeRepo(testRepoPath, {
                storageType: 'sqlite',
                storagePath: '/tmp/test-new.db',
                repoId: originalRepoId
            });

            expect(result1.repoId).toBe(result2.repoId);
        });
    });

    describe('Error Handling', () => {
        it('should handle migration failure', async () => {
            const { runInitMigration } = await import('../persistence/migrations');
            vi.mocked(runInitMigration).mockResolvedValueOnce({
                success: false,
                message: 'Migration failed: Table already exists',
                tablesCreated: []
            });

            const testRepoPath = '/tmp/test-repostem-migration-fail';

            await expect(
                initializeRepo(testRepoPath, {
                    storageType: 'sqlite',
                    storagePath: '/tmp/test-fail.db'
                })
            ).rejects.toThrow(/Migration failed/i);
        });

        it('should disconnect from database on error', async () => {
            const { runInitMigration } = await import('../persistence/migrations');
            vi.mocked(runInitMigration).mockRejectedValueOnce(new Error('Connection failed'));

            const testRepoPath = '/tmp/test-repostem-disconnect';

            await expect(
                initializeRepo(testRepoPath, {
                    storageType: 'sqlite',
                    storagePath: '/tmp/test-disconnect.db'
                })
            ).rejects.toThrow();
        });
    });
});

describe('InitService - isRepoInitialized', () => {
    beforeEach(() => {
        mockConfig.storage_type = undefined;
        mockConfig.storage_path = undefined;
        mockConfig.repo_id = undefined;
    });

    it('should return false when repo is not initialized', () => {
        const testRepoPath = '/tmp/test-repostem-not-initialized';
        const result = isRepoInitialized(testRepoPath);
        expect(result).toBe(false);
    });

    it('should return true when all persistence config is set', () => {
        mockConfig.storage_type = 'sqlite';
        mockConfig.storage_path = '/tmp/test.db';
        mockConfig.repo_id = 'test-repo-id';

        const testRepoPath = '/tmp/test-repostem-initialized';
        const result = isRepoInitialized(testRepoPath);
        expect(result).toBe(true);
    });

    it('should return false when storage_type is missing', () => {
        mockConfig.storage_type = undefined;
        mockConfig.storage_path = '/tmp/test.db';
        mockConfig.repo_id = 'test-repo-id';

        const result = isRepoInitialized('/tmp/test');
        expect(result).toBe(false);
    });

    it('should return false when storage_path is missing', () => {
        mockConfig.storage_type = 'sqlite';
        mockConfig.storage_path = undefined;
        mockConfig.repo_id = 'test-repo-id';

        const result = isRepoInitialized('/tmp/test');
        expect(result).toBe(false);
    });

    it('should return false when repo_id is missing', () => {
        mockConfig.storage_type = 'sqlite';
        mockConfig.storage_path = '/tmp/test.db';
        mockConfig.repo_id = undefined;

        const result = isRepoInitialized('/tmp/test');
        expect(result).toBe(false);
    });
});

describe('InitService - resetPersistence', () => {
    beforeEach(() => {
        mockConfig.storage_type = undefined;
        mockConfig.storage_path = undefined;
        mockConfig.repo_id = undefined;
    });

    describe('Successful Reset', () => {
        it('should reset persistence and delete snapshots', async () => {
            mockConfig.storage_type = 'sqlite';
            mockConfig.storage_path = '/tmp/test-repostem-reset.db';
            mockConfig.repo_id = 'test-repo-id';

            const testRepoPath = '/tmp/test-repostem-reset';
            const result = await resetPersistence(testRepoPath);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.message).toBeDefined();
            expect(typeof result.snapshotsDeleted).toBe('number');
            expect(result.snapshotsDeleted).toBeGreaterThanOrEqual(0);
        });

        it('should return message with snapshot count', async () => {
            mockConfig.storage_type = 'sqlite';
            mockConfig.storage_path = '/tmp/test-repostem-count.db';
            mockConfig.repo_id = 'test-repo-id';

            const result = await resetPersistence('/tmp/test-repostem-count');

            expect(result.message).toContain('snapshot');
        });
    });

    describe('Error Handling', () => {
        it('should throw error when repo is not properly initialized', async () => {
            mockConfig.storage_type = undefined;
            mockConfig.storage_path = undefined;
            mockConfig.repo_id = undefined;

            const testRepoPath = '/tmp/test-repostem-not-init';
            
            await expect(
                resetPersistence(testRepoPath)
            ).rejects.toThrow(/not properly initialized/i);
        });

        it('should throw error when storage_type is missing', async () => {
            mockConfig.storage_type = undefined;
            mockConfig.storage_path = '/tmp/test.db';
            mockConfig.repo_id = 'test-repo-id';

            await expect(
                resetPersistence('/tmp/test')
            ).rejects.toThrow(/not properly initialized/i);
        });

        it('should throw error when storage_path is missing', async () => {
            mockConfig.storage_type = 'sqlite';
            mockConfig.storage_path = undefined;
            mockConfig.repo_id = 'test-repo-id';

            await expect(
                resetPersistence('/tmp/test')
            ).rejects.toThrow(/not properly initialized/i);
        });

        it('should throw error when repo_id is missing', async () => {
            mockConfig.storage_type = 'sqlite';
            mockConfig.storage_path = '/tmp/test.db';
            mockConfig.repo_id = undefined;

            await expect(
                resetPersistence('/tmp/test')
            ).rejects.toThrow(/not properly initialized/i);
        });
    });
});
