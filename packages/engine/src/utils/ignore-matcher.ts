import { minimatch } from 'minimatch';
import path from 'path';

export class IgnoreMatcher {
  private patterns: string[];

  constructor(patterns: string[]) {
    this.patterns = patterns;
  }

  shouldIgnore(filePath: string, repositoryRoot: string): boolean {
    const relativePath = path.relative(repositoryRoot, filePath);
    const normalizedPath = relativePath.split(path.sep).join('/');
    
    for (const pattern of this.patterns) {
      // Skip negation patterns for now (they're handled separately)
      if (pattern.startsWith('!')) {
        continue;
      }
      
      // Skip directory-only patterns (they shouldn't match files)
      if (pattern.endsWith('/')) {
        continue;
      }
      
      // Handle patterns anchored to root (starting with /)
      let effectivePattern = pattern;
      let matchTarget = normalizedPath;
      
      if (pattern.startsWith('/')) {
        effectivePattern = pattern.slice(1);
        // For anchored patterns, the path should match from root
        if (!minimatch(normalizedPath, effectivePattern, { dot: true })) {
          continue;
        }
        return true;
      }
      
      // Standard glob matching
      if (minimatch(normalizedPath, effectivePattern, { dot: true })) {
        return true;
      }
    }
    
    return false;
  }

  shouldIgnoreDirectory(dirPath: string, repositoryRoot: string): boolean {
    const relativePath = path.relative(repositoryRoot, dirPath);
    const normalizedPath = relativePath.split(path.sep).join('/');
    
    for (const pattern of this.patterns) {
      // Skip negation patterns
      if (pattern.startsWith('!')) {
        continue;
      }
      
      // Only ignore directories for patterns that explicitly target directories
      
      // Handle patterns ending with /** (directory and all contents)
      if (pattern.endsWith('/**')) {
        const dirPattern = pattern.slice(0, -3);
        if (minimatch(normalizedPath, dirPattern, { dot: true })) {
          return true;
        }
        continue;
      }
      
      // Handle patterns ending with / (directory-only)
      if (pattern.endsWith('/')) {
        const dirPattern = pattern.slice(0, -1);
        if (minimatch(normalizedPath, dirPattern, { dot: true })) {
          return true;
        }
        continue;
      }
      
      // Handle anchored patterns starting with / and ending with /
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        const dirPattern = pattern.slice(1, -1);
        if (minimatch(normalizedPath, dirPattern, { dot: true })) {
          return true;
        }
        continue;
      }
      
      // Handle simple directory names (no slashes, no wildcards)
      if (!pattern.includes('/') && !pattern.includes('*')) {
        if (normalizedPath === pattern || normalizedPath.endsWith('/' + pattern)) {
          return true;
        }
        continue;
      }
      
      // For all other patterns (file patterns, complex globs), don't ignore the directory
      // Let the file-level ignore handle individual files
    }
    
    return false;
  }
}
