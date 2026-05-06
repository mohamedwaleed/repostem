import ora, { Ora } from 'ora';
import cliProgress, { SingleBar } from 'cli-progress';
import { ProgressEmitter } from '@repostem/engine';

/**
 * ProgressManager - Centralized progress indicator management
 * 
 * Provides spinner (ora) and progress bar (cli-progress) functionality
 * for CLI commands with zero duplication.
 * 
 * Can attach to engine ProgressEmitter for real-time progress tracking.
 */
export class ProgressManager {
  private spinner: Ora | null = null;
  private progressBar: SingleBar | null = null;
  private isTTY: boolean;
  private isEnabled: boolean = true;
  private currentOperation: string = '';

  constructor() {
    // Auto-detect TTY - disable fancy progress in non-interactive environments
    this.isTTY = process.stdout.isTTY && process.stderr.isTTY;
  }
  
  /**
   * Attach to a ProgressEmitter to automatically handle progress events
   */
  attachToEmitter(emitter: ProgressEmitter): void {
    if (!this.isEnabled) return;
    
    // File parsing progress
    emitter.on('files:discovered', ({ totalFiles }) => {
      if (totalFiles === 0) {
        // Discovery phase starting - show spinner
        this.currentOperation = 'discovery';
        this.startSpinner('Discovering files...');
      } else {
        // Discovery complete - show progress bar for parsing
        this.currentOperation = 'parsing';
        if (this.spinner) {
          this.succeedSpinner(`Found ${totalFiles} files`);
        }
        this.startProgress(totalFiles, 'Parsing files');
      }
    });
    
    emitter.on('files:parsing', ({ current, total, file }) => {
      if (this.progressBar) {
        this.progressBar.update(current, { filename: file.substring(0, 50) });
      }
    });
    
    emitter.on('files:parsed', ({ totalFiles }) => {
      this.stopProgress();
      if (this.isTTY) {
        console.log(`✓ Parsed ${totalFiles} files`);
      }
    });
    
    // Graph building
    emitter.on('graph:building', () => {
      this.currentOperation = 'graph';
      this.startSpinner('Building dependency graph...');
    });
    
    emitter.on('graph:built', ({ totalEdges }) => {
      this.succeedSpinner(`Dependency graph built (${totalEdges} edges)`);
    });
    
    // Metrics computation
    emitter.on('metrics:computing', () => {
      this.currentOperation = 'metrics';
      this.startSpinner('Computing metrics...');
    });
    
    emitter.on('metrics:computed', ({ totalFiles }) => {
      this.succeedSpinner(`Metrics computed for ${totalFiles} files`);
    });
    
    // Cycle detection
    emitter.on('cycles:detecting', () => {
      this.currentOperation = 'cycles';
      this.startSpinner('Detecting circular dependencies...');
    });
    
    emitter.on('cycles:detected', ({ cycleCount }) => {
      if (cycleCount > 0) {
        this.warnSpinner(`Found ${cycleCount} circular dependency groups`);
      } else {
        this.succeedSpinner('No circular dependencies detected');
      }
    });
    
    // Risk computation
    emitter.on('risk:computing', () => {
      this.currentOperation = 'risk';
      this.startSpinner('Computing risk scores...');
    });
    
    emitter.on('risk:computed', ({ totalFiles }) => {
      this.succeedSpinner(`Risk scores computed for ${totalFiles} files`);
    });
    
    // Churn analysis
    emitter.on('churn:analyzing', () => {
      this.currentOperation = 'churn';
      this.startSpinner('Analyzing code churn...');
    });
    
    emitter.on('churn:analyzed', ({ filesAnalyzed }) => {
      this.succeedSpinner(`Churn analyzed for ${filesAnalyzed} files`);
    });
    
    // Persistence
    emitter.on('persistence:saving', () => {
      this.currentOperation = 'persistence';
      this.startSpinner('Saving snapshot...');
    });
    
    emitter.on('persistence:saved', ({ snapshotId }) => {
      this.succeedSpinner(`Snapshot saved (${snapshotId.substring(0, 8)}...)`);
    });
    
    // Database operations
    emitter.on('db:connecting', () => {
      this.startSpinner('Connecting to database...');
    });
    
    emitter.on('db:connected', () => {
      this.succeedSpinner('Database connected');
    });
    
    emitter.on('db:migrating', ({ current, total, migration }) => {
      if (!this.progressBar || this.currentOperation !== 'migration') {
        this.currentOperation = 'migration';
        this.startProgress(total, 'Running migrations');
      }
      this.progressBar?.update(current, { migration: migration.substring(0, 40) });
    });
    
    emitter.on('db:migrated', ({ migrationsRun }) => {
      this.stopProgress();
      if (this.isTTY) {
        console.log(`✓ Ran ${migrationsRun} migrations`);
      }
    });
    
    // Snapshot loading
    emitter.on('snapshots:loading', () => {
      this.startSpinner('Loading snapshots...');
    });
    
    emitter.on('snapshots:loaded', ({ count }) => {
      this.succeedSpinner(`Loaded ${count} snapshots`);
    });
    
    // AI operations
    emitter.on('ai:generating', () => {
      this.startSpinner('Generating AI response...');
    });
    
    emitter.on('ai:generated', () => {
      this.succeedSpinner('AI response generated');
    });
  }

  /**
   * Enable or disable progress indicators (useful for JSON output mode)
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if progress is currently active
   */
  isActive(): boolean {
    return this.spinner !== null || this.progressBar !== null;
  }

  /**
   * Start a spinner for indeterminate operations
   */
  startSpinner(text: string): void {
    if (!this.isEnabled || !this.isTTY) {
      console.log(`${text}`);
      return;
    }

    this.clearActive();
    this.spinner = ora({
      text,
      spinner: 'dots',
      color: 'cyan'
    }).start();
  }

  /**
   * Update spinner text
   */
  updateSpinner(text: string): void {
    if (!this.isEnabled) return;

    if (this.spinner) {
      this.spinner.text = text;
    } else if (!this.isTTY) {
      console.log(`${text}`);
    }
  }

  /**
   * Mark spinner as succeeded
   */
  succeedSpinner(text?: string): void {
    if (!this.isEnabled) return;

    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    } else if (!this.isTTY && text) {
      console.log(`✓ ${text}`);
    }
  }

  /**
   * Mark spinner as failed
   */
  failSpinner(text?: string): void {
    if (!this.isEnabled) return;

    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    } else if (!this.isTTY && text) {
      console.log(`✗ ${text}`);
    }
  }

  /**
   * Mark spinner with warning
   */
  warnSpinner(text?: string): void {
    if (!this.isEnabled) return;

    if (this.spinner) {
      this.spinner.warn(text);
      this.spinner = null;
    } else if (!this.isTTY && text) {
      console.log(`⚠ ${text}`);
    }
  }

  /**
   * Mark spinner with info
   */
  infoSpinner(text?: string): void {
    if (!this.isEnabled) return;

    if (this.spinner) {
      this.spinner.info(text);
      this.spinner = null;
    } else if (!this.isTTY && text) {
      console.log(`ℹ ${text}`);
    }
  }

  /**
   * Stop spinner without status
   */
  stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Start a progress bar for determinate operations
   */
  startProgress(total: number, label: string = 'Progress'): void {
    if (!this.isEnabled || !this.isTTY) {
      console.log(`${label}...`);
      return;
    }

    this.clearActive();
    this.progressBar = new cliProgress.SingleBar({
      format: `${label} |{bar}| {percentage}% | {value}/{total}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      forceRedraw: true
    }, cliProgress.Presets.shades_classic);

    this.progressBar.start(total, 0);
  }

  /**
   * Update progress bar current value
   */
  updateProgress(current: number): void {
    if (!this.isEnabled) return;

    if (this.progressBar) {
      this.progressBar.update(current);
    }
  }

  /**
   * Increment progress bar by 1
   */
  incrementProgress(): void {
    if (!this.isEnabled) return;

    if (this.progressBar) {
      this.progressBar.increment();
    }
  }

  /**
   * Stop progress bar
   */
  stopProgress(): void {
    if (this.progressBar) {
      this.progressBar.stop();
      this.progressBar = null;
    }
  }

  /**
   * Start multi-step workflow with step indicators
   */
  startSteps(steps: string[]): void {
    if (!this.isEnabled) {
      console.log('Starting workflow...');
      return;
    }

    // For step-based workflows, we'll use a simple counter approach
    this.stepTotal = steps.length;
    this.currentStep = 0;
    this.stepLabels = steps;
    
    console.log('');
  }

  private stepTotal: number = 0;
  private currentStep: number = 0;
  private stepLabels: string[] = [];

  /**
   * Complete current step and show next
   */
  completeStep(stepName?: string): void {
    if (!this.isEnabled) return;

    this.currentStep++;
    
    if (this.isTTY) {
      const label = stepName || (this.stepLabels[this.currentStep - 1] || 'Step');
      console.log(`  ✓ ${label} (${this.currentStep}/${this.stepTotal})`);
    }
  }

  /**
   * Mark step as failed
   */
  failStep(stepName?: string, error?: string): void {
    if (!this.isEnabled) return;

    const label = stepName || (this.stepLabels[this.currentStep] || 'Step');
    
    if (this.isTTY) {
      console.log(`  ✗ ${label} - Failed`);
      if (error) {
        console.log(`    Error: ${error}`);
      }
    }
  }

  /**
   * Start a single step with spinner
   */
  startStep(stepName: string): void {
    if (!this.isEnabled || !this.isTTY) {
      console.log(`${stepName}...`);
      return;
    }

    this.startSpinner(stepName);
  }

  /**
   * Clear any active progress indicators
   */
  clear(): void {
    this.stopSpinner();
    this.stopProgress();
  }

  /**
   * Clear active indicators (internal)
   */
  private clearActive(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
    if (this.progressBar) {
      this.progressBar.stop();
      this.progressBar = null;
    }
  }
}

// Singleton instance for convenience
export const progress = new ProgressManager();
