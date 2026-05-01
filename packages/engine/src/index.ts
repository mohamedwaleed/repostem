// Application layer exports
export {
    analyzeRepository,
    analyzeFileRisk,
    computeFileImpact,
    detectRepositoryCycles,
    ask,
    initializeRepo,
    isRepoInitialized,
    resetPersistence,
    explainFileRisk,
    explainFileImpact,
    detectDrift,
    DriftResult,
    getSnapshotHistory,
} from './application';

// Utilities
export { classify } from './utils/classify';

export { getMetricLabel, METRIC_LABELS } from './metric-labels';

export * from './types';

// Config exports
export {
    checkConfigFile,
    getConfig,
    createConfigFile,
    updateConfigFile,
    addConfig,
    isPersistenceConfigured
} from './config/config-loader';

// Persistence exports
export {
  AdapterFactory,
  DatabaseType,
  DatabaseAdapter
} from './persistence/adapters';

export {
  RepoRepository,
  RepoRecord,
  SnapshotRepository,
  SnapshotRecord
} from './persistence/repositories';

export {
  runKnexMigrations,
  getMigrationStatus,
  rollbackMigrations,
  KnexMigrationResult
} from './persistence/knex-migration-runner';
