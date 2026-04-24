import { MigrationResult } from "./persistence";

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
  migrationResult: MigrationResult;
  message: string;
}
