import { EventEmitter } from 'events';

/**
 * Progress event types emitted during repository analysis
 */
export interface ProgressEvents {
  // File discovery and parsing
  'files:discovered': { totalFiles: number };
  'files:parsing': { current: number; total: number; file: string };
  'files:parsed': { totalFiles: number };
  
  // Dependency graph building
  'graph:building': void;
  'graph:built': { totalEdges: number };
  
  // Metrics computation
  'metrics:computing': void;
  'metrics:computed': { totalFiles: number };
  
  // Risk calculation
  'risk:computing': void;
  'risk:computed': { totalFiles: number };
  
  // Cycle detection
  'cycles:detecting': void;
  'cycles:detected': { cycleCount: number };
  
  // Churn analysis
  'churn:analyzing': void;
  'churn:analyzed': { filesAnalyzed: number };
  
  // Persistence
  'persistence:saving': void;
  'persistence:saved': { snapshotId: string };
  
  // Database operations
  'db:connecting': void;
  'db:connected': void;
  'db:migrating': { current: number; total: number; migration: string };
  'db:migrated': { migrationsRun: number };
  
  // Snapshot loading
  'snapshots:loading': void;
  'snapshots:loaded': { count: number };
  
  // AI operations
  'ai:generating': void;
  'ai:generated': void;
  
  // Generic progress
  'step:start': { step: string };
  'step:complete': { step: string };
  'step:error': { step: string; error: string };
}

/**
 * Type-safe event emitter for progress tracking
 */
export class ProgressEmitter extends EventEmitter {
  emit<K extends keyof ProgressEvents>(
    event: K,
    data: ProgressEvents[K]
  ): boolean {
    return super.emit(event, data);
  }

  on<K extends keyof ProgressEvents>(
    event: K,
    listener: (data: ProgressEvents[K]) => void
  ): this {
    return super.on(event, listener);
  }

  once<K extends keyof ProgressEvents>(
    event: K,
    listener: (data: ProgressEvents[K]) => void
  ): this {
    return super.once(event, listener);
  }

  off<K extends keyof ProgressEvents>(
    event: K,
    listener: (data: ProgressEvents[K]) => void
  ): this {
    return super.off(event, listener);
  }
}

/**
 * Options for operations that support progress tracking
 */
export interface ProgressOptions {
  progress?: ProgressEmitter;
}

/**
 * Helper to safely emit progress events
 */
export function emitProgress<K extends keyof ProgressEvents>(
  emitter: ProgressEmitter | undefined,
  event: K,
  data: ProgressEvents[K]
): void {
  if (emitter) {
    emitter.emit(event, data);
  }
}
