// Analyze Service
export {
  analyzeRepository,
  analyzeFileRisk,
  computeFileImpact,
  detectRepositoryCycles,
  explainFileRisk,
  explainFileImpact
} from './analyze-service';

// Ask Service
export { ask } from './ask-service';

// Drift Service
export { detectDrift, DriftResult } from './drift-service';

// History Service
export { 
  getSnapshotHistory, 
  getFileHistory, 
  SnapshotHistoryItem, 
  FileHistoryItem 
} from './history-service';

// Init Service
export {
  initializeRepo,
  isRepoInitialized,
  resetPersistence
} from './init-service';
