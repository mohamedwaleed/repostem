import { ParsedSyntax } from "../../../types";
import { ILanguageParser } from "../language-parser-interface";
import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import { SyntaxProcessorFactory } from "../../syntax-processors/syntax-processor-factory";
import { TsImportProcessor } from "../typescript/ts-import-processor";

export class JavaScriptParser implements ILanguageParser {
  private parser: Parser;
  private processorFactory: SyntaxProcessorFactory;
  
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(JavaScript);
    this.processorFactory = new SyntaxProcessorFactory([
      new TsImportProcessor(),
    ]);
  }
  
  parse(fileContent: string, currentFilePath: string, repositoryRoot: string): ParsedSyntax {
    const tree = this.parser.parse(fileContent);
    return this.processorFactory.processAll(tree.rootNode.children, {
      currentFilePath,
      repositoryRoot
    });
  }
}