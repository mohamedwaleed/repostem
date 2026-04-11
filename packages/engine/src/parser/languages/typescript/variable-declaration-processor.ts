import { ISyntaxProcessor, SyntaxProcessorContext } from "../../syntax-processors/syntax-processor";
import { ParsedImport, SyntaxType } from "../../../types";
import Parser from "tree-sitter";
import { resolveImportPath } from "../../path-resolver";

/**
 * Processor for variable declarations containing require() calls.
 * Handles patterns like: const x = require('module'), var y = require('./file')
 */
export class VariableDeclarationProcessor implements ISyntaxProcessor<ParsedImport> {
  readonly syntaxType = SyntaxType.variable_declaration;

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
    if (importPath.startsWith('./')) return false;
    if (importPath.startsWith('../')) return false;
    if (importPath.startsWith('/')) return false;
    if (importPath.startsWith('@/')) return false;
    return true;
  }
}
