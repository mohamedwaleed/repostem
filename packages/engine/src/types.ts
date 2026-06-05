import { KnexMigrationResult, SnapshotRepository } from "./persistence";

export interface ParsedFile {
    path: string;
    syntax: ParsedSyntax;
    metadata: FileMetadata;
}

export interface ParsedImport {
  source: string;
  resolvedPath: string | null;
  isExternal: boolean;
}

export interface FileMetadata {
    size: number;
    extension: string;
}

export interface ParseResult {
    files: ParsedFile[];
    repositoryRoot: string;
}

export interface ParseOptions {
    language: Language;
}

export enum Language {
    typescript = "typescript",
    javascript = "javascript"
}

export enum SyntaxType {
    import_statement = "import_statement",
    export_statement = "export_statement",
    require_statement = "require_statement",
    expression_statement = "expression_statement",
    variable_declaration = "variable_declaration"
}

export interface ParsedSyntax {
    [key: string]: any[];
}

export enum DependencyGraphType {
    inMemory = 'in-memory'
}

export interface Cycle {
  nodes: string[];
}

export interface MetricContext {
    maxCommits: number;
    totalFiles: number;
    repositoryRoot: string;
    commitsPerFile: Map<string, number>;
}

export interface FileAnalysis {
    file: string;
    riskScore: number;
    riskLevel: MetricClassification;
    metrics: FileMetrics;
}

export interface RankedFile {
  file: string;
  score: number;
}

export interface ProjectAnalysisResult {
  totalFiles: number;
  totalDependencies: number;
  cycleCount: number;
  topCentralFiles: RankedFile[];
  topRiskFiles: RankedFile[];
  highChurnFiles: RankedFile[];
  branch?: string | null;
  dirty?: boolean;
}

export interface FileRiskResult {
  file: string;
  riskScore: number;
  riskLevel: MetricClassification;
}

export interface FileImpactResult {
  file: string;
  directDependents: string[];
  transitiveDependents: string[];
  totalImpactCount: number;
  impactRatio: number;
}

export enum AIProvider {
    OPENAI = "openai"
}

export enum MetricClassification {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}

export type StorageType = 'sqlite' | 'postgresql';

export interface RepoStemConfig {
  ignore?: string[];
  respectGitignore?: boolean;
  storage_type?: StorageType;
  storage_path?: string;
  repo_id?: string;
}

export interface ResetPersistenceResult {
  success: boolean;
  message: string;
  snapshotsDeleted: number;
}

export interface MetricConfig {
    key: string;
    extractValue: (fileAnalysis: FileAnalysis, metrics: any) => number;
    threshold?: number;
    sortDescending?: boolean;
}

export interface FileMetrics {
    centrality: number;
    coupling: number;
    churn: number;
    circularDependency: number;
    [key: string]: number;
}

export interface FileRiskAnalysisResult {
    file: string;
    riskScore: number;
    riskLevel: MetricClassification;
    centrality: number;
    coupling: number;
    churn: number;
    hasCircularDependency: boolean;
}

export interface InitRepoOptions {
  storageType: StorageType;
  storagePath: string;
  repoId?: string;
}

/**
 * Result of initializing a repository
 */
export interface InitRepoResult {
  success: boolean;
  repoId: string;
  config: RepoStemConfig;
  migrationResult: KnexMigrationResult;
  message: string;
}

export interface SnapshotMetadata {
    branch: string | null;
    commitHash: string | null;
    dirty: boolean;
    createdAt: Date;
}

export interface SnapshotSummary {
    totalFiles: number;
    totalDependencies: number;
    cycleCount: number;
}

export interface FileSnapshot {
    path: string;
    metrics: FileMetrics;
    riskScore: number;
    riskLevel: MetricClassification;
}

export interface SnapshotAggregate {
    repositoryRoot: string;
    metadata: SnapshotMetadata;
    summary: SnapshotSummary;
    files: Map<string, FileSnapshot>;
    edges: Map<string, Set<string>>;
    cycles: Cycle[];
}

export interface AnalyzeRepositoryResult {
  analysis: ProjectAnalysisResult;
  snapshotId?: string;
  persisted: boolean;
  warning?: string;
}

export interface SnapshotHistoryRecord {
  id: string;
  repo_id: string;
  git_remote_url: string | null;
  branch: string | null;
  commit_hash: string | null;
  working_tree_dirty: boolean;
  total_files: number | null;
  cycle_count: number | null;
  created_at: Date;
}

export interface DriftResult {
  previousSnapshot: DriftSnapshotInfo;
  currentSnapshot: DriftSnapshotInfo;
  riskChanges: {
    increasedCount: number;
    decreasedCount: number;
    items: RiskChangeItem[];
  };
  impactChanges: {
    increasedCount: number;
    decreasedCount: number;
    items: ImpactChangeItem[];
  };
  dependencyChanges: DependencyChangeSummary;
  cycleChanges: CycleChangeSummary;
  complexityScoreChange: ComplexityScoreChange;
  hotspotChanges: HotspotChangeSummary;
}

export interface HotspotChangeSummary {
  newHotspots: HotspotItem[];
  resolvedHotspots: HotspotItem[];
}

export interface HotspotItem {
  file: string;
  currentHotspotScore: number;
  previousHotspotScore: number;
  delta: number;
}

export interface DriftSnapshotInfo {
  commitHash: string | null;
  dirty: boolean;
  date: Date;
}

export interface RiskChangeItem {
  file: string;
  previousRisk: number;
  currentRisk: number;
  delta: number;
}

export interface ImpactChangeItem {
  file: string;
  previousImpactRatio: number;
  currentImpactRatio: number;
  previousTransitiveDependents: number;
  currentTransitiveDependents: number;
  impactRatioDelta: number;
  transitiveDependentsDelta: number;
}

export interface DependencyChangeSummary {
  newEdges: number;
  removedEdges: number;
}

export interface CycleChangeSummary {
  newCycles: Cycle[];
  resolvedCycles: Cycle[];
}

export interface ComplexityScoreChange {
  previousComplexityScore: number;
  currentComplexityScore: number;
  delta: number;
}

export interface ServiceOptions {
  repo?: string;
  branch?: string;
  noBranchFilter?: boolean;
}

export interface ServiceContext {
  repoPath: string;
  config: {
    repo_id: string;
    storage_type: string;
    storage_path: string;
  };
  repo: SnapshotRepository;
  adapter: any; // DatabaseAdapter - using any to avoid circular dependency
  branch: string | undefined;
}

export interface DriftServiceOptions extends ServiceOptions {
  since?: string; // snapshot ID
}

export interface HotspotTrendServiceOptions extends ServiceOptions {
  since?: string; // snapshot ID
}

export interface Hotspot {
  file: string;
  riskScore: number;
  impactRatio: number;
  churn: number;
  circularDependency: number;
  hotspotScore: number;
}

export interface HotspotTrendItem {
  file: string;
  previousRiskScore: number;
  currentRiskScore: number;
  riskDelta: number;
  previousImpactRatio: number;
  currentImpactRatio: number;
  impactDelta: number;
  trendScore: number;
}

export interface AskServiceOptions {
  branch?: string;
  noBranchFilter?: boolean;
  since?: string;
}