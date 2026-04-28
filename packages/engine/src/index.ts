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
    getFileHistory,
    SnapshotHistoryItem,
    FileHistoryItem
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
