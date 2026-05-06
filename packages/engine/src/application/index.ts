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
export { detectDrift } from './drift-service';
export { DriftResult } from '../types';

// History Service
export { 
  getSnapshotHistory, 
} from './history-service';

// Init Service
export {
  initializeRepo,
  isRepoInitialized,
  resetPersistence
} from './init-service';

export {
  calculateHotspots
} from './hotspot-service';

export {
  calculateHotspotTrends
} from './hotspot-trend-service';
export { HotspotTrendServiceOptions, AskServiceOptions, HotspotTrendItem } from '../types';
