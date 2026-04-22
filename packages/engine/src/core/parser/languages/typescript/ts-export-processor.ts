import { ISyntaxProcessor, SyntaxProcessorContext } from "../../syntax-processors/syntax-processor";
import { ParsedImport, SyntaxType } from "../../../../types";
import Parser from "tree-sitter";
import { resolveImportPath } from "../../path-resolver";

/**
 * TypeScript/JavaScript export statement processor.
 * Extracts export...from statements (re-exports) from TS/JS AST nodes.
 * These create dependencies just like imports.
 */
export class TsExportProcessor implements ISyntaxProcessor<ParsedImport> {
  readonly syntaxType = SyntaxType.export_statement;

  process(node: Parser.SyntaxNode, context: SyntaxProcessorContext): ParsedImport | null {
    // Only process export statements that have a 'from' clause
    // e.g., export { x } from './module' or export * from './module'
    let hasFromClause = false;
    let source = '';
    
    for (const child of node.children) {
      if (child.type === 'from') {
        hasFromClause = true;
      }
      if (child.type === 'string') {
        const fullText = child.text;
        source = fullText.slice(1, -1); // Remove surrounding quotes
      }
    }
    
    if (!hasFromClause || !source) {
      return null;
    }
    
    const isExternal = this.isExternalImport(source);
    const resolvedPath = context.currentFilePath && context.repositoryRoot && !isExternal
      ? resolveImportPath(source, context.currentFilePath, context.repositoryRoot)
      : null;
    
    return {
      source,
      resolvedPath,
      isExternal
    };
  }

  private isExternalImport(importPath: string): boolean {
    if (importPath.startsWith('./')) return false;
    if (importPath.startsWith('../')) return false;
    if (importPath.startsWith('/')) return false;
    if (importPath.startsWith('@/')) return false;
    return true;
  }
}
