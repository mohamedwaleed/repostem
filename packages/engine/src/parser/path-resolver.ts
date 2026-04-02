import { existsSync } from "fs";
import path from "path";
import { ALL_SUPPORTED_EXTENSIONS } from "../utils/file-extensions";

/**
 * Resolves an import path to a repository-relative file path
 * @param importSource - The import source string (e.g., './utils/logger', '../db/client')
 * @param currentFilePath - The absolute path of the file containing the import
 * @param repositoryRoot - The absolute path to the repository root
 * @returns Path relative to repository root (e.g., 'src/utils/logger.ts'), or null if not found
 */
export function resolveImportPath(
  importSource: string,
  currentFilePath: string,
  repositoryRoot: string
): string | null {
  // Skip external imports (they don't have file paths)
  if (isExternalImport(importSource)) {
    return null;
  }

  const currentDir = path.dirname(currentFilePath);
  const extensions = ALL_SUPPORTED_EXTENSIONS;

  // Resolve to absolute path first
  let absolutePath = path.resolve(currentDir, importSource);

  // Try exact path first
  if (existsSync(absolutePath) && !isDirectory(absolutePath)) {
    return path.relative(repositoryRoot, absolutePath);
  }

  // Try with extensions
  for (const ext of extensions) {
    const pathWithExt = absolutePath + ext;
    if (existsSync(pathWithExt)) {
      return path.relative(repositoryRoot, pathWithExt);
    }
  }

  // Try index files (e.g., './utils' -> './utils/index.ts')
  for (const ext of extensions) {
    const indexPath = path.join(absolutePath, `index${ext}`);
    if (existsSync(indexPath)) {
      return path.relative(repositoryRoot, indexPath);
    }
  }

  // Could not resolve
  return null;
}

function isExternalImport(importPath: string): boolean {
  if (importPath.startsWith('./')) return false;
  if (importPath.startsWith('../')) return false;
  if (importPath.startsWith('/')) return false;
  if (importPath.startsWith('@/')) return false;
  return true;
}

function isDirectory(filePath: string): boolean {
  try {
    const fs = require('fs');
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}
