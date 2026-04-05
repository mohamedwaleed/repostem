import { ILanguageParser } from "../language-parser-interface";
import { ParsedSyntax, ParsedImport, SyntaxType, Language } from "../../../types";
import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import JavaScript from "tree-sitter-javascript";
import { SyntaxProcessorFactory } from "../../syntax-processors/syntax-processor-factory";
import { TsImportProcessor } from "./ts-import-processor";
import { JavascriptImportProcessor } from "./javascript-import-processor";
import path from "path";
import { getExtensionsForLanguage } from "../../../utils/file-extensions";

export class TypeScriptParser implements ILanguageParser {
  private parser: Parser;
  private processorFactory: SyntaxProcessorFactory;
  
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(TypeScript.typescript);
    this.processorFactory = new SyntaxProcessorFactory([
      new TsImportProcessor(),
      new JavascriptImportProcessor(),
    ]);
  }
  
  parse(fileContent: string, currentFilePath: string, repositoryRoot: string): ParsedSyntax {
    const fileExtension = path.extname(currentFilePath);
    if (getExtensionsForLanguage(Language.javascript).includes(fileExtension)) {
      this.parser.setLanguage(JavaScript);
    } else {
      this.parser.setLanguage(TypeScript.typescript);
    }
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
    const tsImports = (syntax[SyntaxType.import_statement] as ParsedImport[]) || [];
    const jsRequires = (syntax[SyntaxType.expression_statement] as ParsedImport[]) || [];
    return [...tsImports, ...jsRequires];
  }
}