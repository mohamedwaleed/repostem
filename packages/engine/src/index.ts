export {
    analyzeRepository,
    analyzeFileRisk,
    computeFileImpact,
    detectRepositoryCycles,
    ask,
    classify,
    initializeRepo,
    isRepoInitialized,
    resetPersistence
} from './engine';

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
  RepoRecord
} from './persistence/repositories';
