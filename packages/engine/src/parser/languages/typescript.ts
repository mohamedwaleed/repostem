import { ILanguageParser } from "./language-parser-interface";
import { ParsedSyntax, Syntax, ParsedImport } from "../../types";
import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import { resolveImportPath } from "../path-resolver";

export class TypeScriptParser implements ILanguageParser {
  private parser: Parser;
  private supportedSyntaxes: Syntax[];
  
  constructor(supportedSyntaxes: Syntax[] = [
    Syntax.import_statement,
    Syntax.export_statement
  ]) {
    this.parser = new Parser();
    this.parser.setLanguage(TypeScript.typescript);
    this.supportedSyntaxes = supportedSyntaxes;
  }
  
  parse(fileContent: string, currentFilePath?: string, repositoryRoot?: string): ParsedSyntax {
    const tree = this.parser.parse(fileContent);
    const filteredSyntaxes = tree.rootNode.children.filter((node) => 
      this.supportedSyntaxes.includes(node.type as Syntax)
    );
    
    const imports: ParsedImport[] = filteredSyntaxes
      .filter((node) => node.type === Syntax.import_statement)
      .map((node) => this.extractImport(node, currentFilePath, repositoryRoot))
      .filter((imp): imp is ParsedImport => imp !== null);

    const exports = filteredSyntaxes
      .filter((node) => node.type === Syntax.export_statement)
      .map((node) => this.extractExportSource(node))
      .filter((source): source is string => source !== null);
    
    console.log("Extracted imports:", imports);
    console.log("Extracted export sources:", exports);
    
    return {
      imports,
      exports: []
    };
  }
  
  private extractImport(importNode: Parser.SyntaxNode, currentFilePath?: string, repositoryRoot?: string): ParsedImport | null {
    // Traverse children to find the string node (the import path)
    for (const child of importNode.children) {
      if (child.type === 'string') {
        // Remove quotes from the string
        const fullText = child.text;
        const source = fullText.slice(1, -1); // Remove surrounding quotes
        
        const isExternal = this.isExternalImport(source);
        const resolvedPath = currentFilePath && repositoryRoot && !isExternal
          ? resolveImportPath(source, currentFilePath, repositoryRoot)
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
  
  private extractExportSource(exportNode: Parser.SyntaxNode): string | null {
    // For now, return null as we don't have a specific export syntax to extract
    // This can be enhanced later to extract export paths
    return null;
  }
}