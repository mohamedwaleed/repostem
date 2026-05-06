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
    calculateHotspots,
    calculateHotspotTrends,
    HotspotTrendItem,
    HotspotTrendServiceOptions,
} from './application';

// Utilities
export { classify } from './utils/classify';

export { getMetricLabel, METRIC_LABELS } from './metric-labels';

// Progress tracking
export { ProgressEmitter, ProgressEvents, ProgressOptions, emitProgress } from './utils/progress-emitter';

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
