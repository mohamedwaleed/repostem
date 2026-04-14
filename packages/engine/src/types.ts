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
    metrics: Record<string, number>;
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
  centrality: number;
  coupling: number;
  churn: number;
  hasCircularDependency: boolean;
  riskScore: number;
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

export interface RepoStemConfig {
  ignore?: string[];
  respectGitignore?: boolean;
}