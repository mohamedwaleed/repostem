

import { readdirSync, existsSync, statSync, readFileSync } from "fs";
import { ParsedFile, ParseResult, ParseOptions, Language } from "../../types";
import path from "path";
import getLanguageParser from "./language-parser-factory";
import { isSupportedExtension } from "../../utils/file-extensions";
import { getAllIgnorePatterns } from "../../config/config-loader";
import { IgnoreMatcher } from "../../utils/ignore-matcher";
import { ProgressEmitter, emitProgress } from "../../utils/progress-emitter";

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

function parseRepositoryFiles(repositoryPath: string, parseOptions: ParseOptions, progressEmitter?: ProgressEmitter) {
    const ignorePatterns = getAllIgnorePatterns(repositoryPath);
    const ignoreMatcher = new IgnoreMatcher(ignorePatterns);
    
    // First pass: discover all files with progress
    emitProgress(progressEmitter, 'files:discovered', { totalFiles: 0 }); // Signal start of discovery
    
    const filesToParse: string[] = [];
    const stack: string[] = [repositoryPath];
    
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
                    filesToParse.push(fullPath);
                }
            }
        }
    }
    
    // Emit total files discovered (discovery complete)
    emitProgress(progressEmitter, 'files:discovered', { totalFiles: filesToParse.length });
    
    // Second pass: parse files with progress tracking
    const parseResult: ParseResult = {
        files: [],
        repositoryRoot: repositoryPath
    };
    
    // Update progress every N files to avoid overwhelming the UI
    const progressUpdateInterval = Math.max(1, Math.floor(filesToParse.length / 100));
    
    for (let i = 0; i < filesToParse.length; i++) {
        const fullPath = filesToParse[i];
        const relativePath = path.relative(repositoryPath, fullPath);
        
        // Only emit progress on interval or last file
        if (i % progressUpdateInterval === 0 || i === filesToParse.length - 1) {
            emitProgress(progressEmitter, 'files:parsing', { 
                current: i + 1, 
                total: filesToParse.length,
                file: relativePath
            });
        }
        
        const file = parseFile(fullPath, parseOptions, repositoryPath);
        if (file) {
            parseResult.files.push(file);
        }
    }
    
    emitProgress(progressEmitter, 'files:parsed', { totalFiles: parseResult.files.length });
    
    return parseResult;
}

export default function parseRepository(
    repositoryPath: string, 
    parseOptions: ParseOptions = { language: Language.typescript },
    progressEmitter?: ProgressEmitter
): ParseResult {
    if (!repositoryPath) {
        throw new Error("Project path is required");
    }
    if (!existsSync(repositoryPath)) {
        throw new Error("Project path does not exist");
    }
    if (!statSync(repositoryPath).isDirectory()) {
        throw new Error("Project path must be a directory");
    }
    return parseRepositoryFiles(repositoryPath, parseOptions, progressEmitter);
}
