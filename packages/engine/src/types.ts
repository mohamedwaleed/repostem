export interface ParsedFile {
    path: string;
    imports: ParsedImport[];
    exports: ParsedExport[];
    metadata: FileMetadata;
}

export interface ParsedImport {
  source: string;
  resolvedPath: string | null;
  isExternal: boolean;
}

export interface ParsedExport {
  name: string;
  kind: string;
}

export interface FileMetadata {
    size: number;
    extension: string;
}

export interface ParseResult {
    files: ParsedFile[];
}

export interface ParseOptions {
    language: Language;
}

export enum Language {
    typescript = "typescript",
    javascript = "javascript"
}

export enum Syntax {
    import_statement = "import_statement",
    export_statement = "export_statement"
}

export interface ParsedSyntax {
    imports: ParsedImport[];
    exports: ParsedExport[];
    // Future: classes, functions, etc.
}