import { ISyntaxProcessor, SyntaxProcessorContext } from "../../syntax-processors/syntax-processor";
import { ParsedImport, SyntaxType } from "../../../types";
import Parser from "tree-sitter";
import { resolveImportPath } from "../../path-resolver";

/**
 * TypeScript/JavaScript-specific import processor.
 * Extracts import statements from TS/JS AST nodes.
 * This is LANGUAGE-SPECIFIC code — lives alongside the language parser.
 */
export class TsImportProcessor implements ISyntaxProcessor<ParsedImport> {
  readonly syntaxType = SyntaxType.import_statement;

  process(node: Parser.SyntaxNode, context: SyntaxProcessorContext): ParsedImport | null {
    // Traverse children to find the string node (the import path)
    for (const child of node.children) {
      if (child.type === 'string') {
        // Remove quotes from the string
        const fullText = child.text;
        const source = fullText.slice(1, -1); // Remove surrounding quotes
        
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
    }
    return null;
  }

  private isExternalImport(importPath: string): boolean {
    // An import is external (npm package) if it doesn't start with:
    // - './' (relative current directory)
    // - '../' (relative parent directory)
    // - '/' (absolute path)
    // - '@/' (path alias - considered internal)
    
    if (importPath.startsWith('./')) return false;
    if (importPath.startsWith('../')) return false;
    if (importPath.startsWith('/')) return false;
    if (importPath.startsWith('@/')) return false;
    
    // Everything else is considered external (npm packages)
    // Examples: 'react', 'lodash', '@types/node', 'tree-sitter'
    return true;
  }
}
