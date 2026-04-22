import { ISyntaxProcessor, SyntaxProcessorContext } from "../../syntax-processors/syntax-processor";
import { ParsedImport, SyntaxType } from "../../../../types";
import Parser from "tree-sitter";
import { resolveImportPath } from "../../path-resolver";

/**
 * JavaScript-specific import processor for CommonJS require() statements.
 * Extracts import paths from require() calls in JavaScript AST nodes.
 * This is LANGUAGE-SPECIFIC code — lives alongside the language parser.
 */
export class JavascriptImportProcessor implements ISyntaxProcessor<ParsedImport> {
  readonly syntaxType = SyntaxType.expression_statement;

  process(node: Parser.SyntaxNode, context: SyntaxProcessorContext): ParsedImport | null {
    const requireCall = this.findRequireCall(node);
    if (requireCall) {
      const isExternal = this.isExternalImport(requireCall);
      const resolvedPath = context.currentFilePath && context.repositoryRoot && !isExternal
        ? resolveImportPath(requireCall, context.currentFilePath, context.repositoryRoot)
        : null;
      
      return {
        source: requireCall,
        resolvedPath,
        isExternal
      };
    }
    return null;
  }

  private findRequireCall(node: Parser.SyntaxNode): string | null {
    if (node.type === 'call_expression') {
      const identifier = node.children.find(c => c.type === 'identifier');
      if (identifier?.text === 'require') {
        return this.extractStringFromArguments(node);
      }
    }
    
    for (const child of node.children) {
      const result = this.findRequireCall(child);
      if (result) return result;
    }
    
    return null;
  }

  private extractStringFromArguments(callNode: Parser.SyntaxNode): string | null {
    for (const child of callNode.children) {
      if (child.type === 'arguments') {
        for (const arg of child.children) {
          if (arg.type === 'string') {
            return arg.text.slice(1, -1);
          }
        }
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
