import { ParsedSyntax, ParsedImport, SyntaxType } from "../../../types";
import Parser from "tree-sitter";

/**
 * Base interface for syntax processors
 * Each processor handles a specific syntax type (imports, exports, classes, etc.)
 */
export interface ISyntaxProcessor<T = any> {
  readonly syntaxType: SyntaxType;
  process(node: Parser.SyntaxNode, context: SyntaxProcessorContext): T | null;
}

/**
 * Context provided to all syntax processors
 */
export interface SyntaxProcessorContext {
  currentFilePath?: string;
  repositoryRoot?: string;
}

/**
 * Result of processing all syntax nodes
 * Fully dynamic - no hardcoded syntax types
 */
export interface SyntaxProcessorResult {
  [key: string]: any[];
}
