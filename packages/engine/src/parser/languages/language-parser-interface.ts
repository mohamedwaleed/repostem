import { ParsedSyntax } from "../../types";

export interface ILanguageParser {
  parse(fileContent: string, currentFilePath?: string, repositoryRoot?: string): ParsedSyntax;
}
