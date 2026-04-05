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
    expression_statement = "expression_statement"
}

export interface ParsedSyntax {
    [key: string]: any[];
}