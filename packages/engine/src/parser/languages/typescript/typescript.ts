import { ILanguageParser } from "../language-parser-interface";
import { ParsedSyntax, ParsedImport, SyntaxType } from "../../../types";
import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import { SyntaxProcessorFactory } from "../../syntax-processors/syntax-processor-factory";
import { TsImportProcessor } from "./ts-import-processor";

export class TypeScriptParser implements ILanguageParser {
  private parser: Parser;
  private processorFactory: SyntaxProcessorFactory;
  
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(TypeScript.typescript);
    this.processorFactory = new SyntaxProcessorFactory([
      new TsImportProcessor(),
      // Future: new TsExportProcessor(), new TsClassProcessor(), etc.
    ]);
  }
  
  parse(fileContent: string, currentFilePath?: string, repositoryRoot?: string): ParsedSyntax {
    const tree = this.parser.parse(fileContent);
    const result = this.processorFactory.processAll(tree.rootNode.children, {
      currentFilePath,
      repositoryRoot
    });
    return {
      imports: this.getImports(result) || [],
    };
  }
  
  private getImports(syntax: ParsedSyntax): ParsedImport[] {
    return (syntax[SyntaxType.import_statement] as ParsedImport[]) || [];
  }
}