

import { readdirSync, existsSync, statSync, readFileSync } from "fs";
import { ParsedFile, ParseResult, ParseOptions, Language } from "../types";
import path from "path";
import getLanguageParser from "./language-parser-factory";
import { isSupportedExtension } from "../utils/file-extensions";
import { getAllIgnorePatterns } from "../config/config-loader";
import { IgnoreMatcher } from "../utils/ignore-matcher";

function parseFile(filePath: string, parseOptions: ParseOptions, repositoryRoot: string): ParsedFile | null {
    try {
        const fileContent = readFileSync(filePath, "utf-8");
        const languageParser = getLanguageParser(parseOptions.language);
        const parsedSyntax = languageParser.parse(fileContent, filePath, repositoryRoot);
        return {
            path: path.relative(repositoryRoot, filePath),
            syntax: parsedSyntax,
            metadata: {
                size: statSync(filePath).size,
                extension: path.extname(filePath)
            }
        };
    } catch (error) {
        console.warn(`Failed to parse file ${filePath}:`, error instanceof Error ? error.message : error);
        return null;
    }
}

function parseRepositoryFiles(repositoryPath: string, parseOptions: ParseOptions) {
    const ignorePatterns = getAllIgnorePatterns(repositoryPath);
    const ignoreMatcher = new IgnoreMatcher(ignorePatterns);
    
    const stack: string[] = [repositoryPath];
    const parseResult: ParseResult = {
        files: [],
        repositoryRoot: repositoryPath
    };
    
    while (stack.length > 0) {
        const currentPath = stack.pop()!;
        const directories = readdirSync(currentPath);
        for (const directory of directories) {
            const fullPath = path.join(currentPath, directory);
            if(statSync(fullPath).isDirectory()) {
                if (!ignoreMatcher.shouldIgnoreDirectory(fullPath, repositoryPath)) {
                    stack.push(fullPath);
                }
            } else {
                if (!ignoreMatcher.shouldIgnore(fullPath, repositoryPath) && isSupportedExtension(fullPath)) {
                    const file = parseFile(fullPath, parseOptions, repositoryPath);
                    if (file) {
                        parseResult.files.push(file);
                    }
                }
            }
        }
    }
    return parseResult;
}

export default function parseRepository(repositoryPath: string, parseOptions: ParseOptions = {
    language: Language.typescript
}): ParseResult {
    if (!repositoryPath) {
        throw new Error("Project path is required");
    }
    if (!existsSync(repositoryPath)) {
        throw new Error("Project path does not exist");
    }
    if (!statSync(repositoryPath).isDirectory()) {
        throw new Error("Project path must be a directory");
    }
    return parseRepositoryFiles(repositoryPath, parseOptions);
}
