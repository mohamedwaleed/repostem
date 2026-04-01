

import { readdirSync, existsSync, statSync, readFileSync } from "fs";
import { ParsedFile, ParseResult, ParseOptions, Language } from "../types";
import path from "path";
import getLanguageParser from "./language-parser-factory";
import { isSupportedExtension } from "../utils/file-extensions";

function parseFile(filePath: string, parseOptions: ParseOptions, repositoryRoot: string): ParsedFile {
    const fileContent = readFileSync(filePath, "utf-8");
    const languageParser = getLanguageParser(parseOptions.language);
    const parsedSyntax = languageParser.parse(fileContent, filePath, repositoryRoot);
    return {
        path: path.relative(repositoryRoot, filePath),
        imports: parsedSyntax.imports,
        exports: parsedSyntax.exports,
        metadata: {
            size: statSync(filePath).size,
            extension: path.extname(filePath)
        }
    };
}

function parseRepositoryFiles(repositoryPath: string, parseOptions: ParseOptions) {
    const stack: string[] = [repositoryPath];
    const parseResult: ParseResult = {
        files: []
    };
    while (stack.length > 0) {
        const currentPath = stack.pop()!;
        const directories = readdirSync(currentPath);
        for (const directory of directories) {
            const fullPath = path.join(currentPath, directory);
            if(statSync(fullPath).isDirectory()) {
                stack.push(fullPath);
            } else {
                // Only parse files with supported extensions
                if (isSupportedExtension(fullPath)) {
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

parseFile(
    "/Users/mohamedmohamed/Desktop/projects/repostem/examples/sample-repo/src/app.ts",
    { language: Language.typescript },
    "/Users/mohamedmohamed/Desktop/projects/repostem/examples/sample-repo"
);