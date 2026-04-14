import { minimatch } from 'minimatch';
import path from 'path';

export class IgnoreMatcher {
  private patterns: string[];

  constructor(patterns: string[]) {
    this.patterns = patterns;
  }

  shouldIgnore(filePath: string, repositoryRoot: string): boolean {
    const relativePath = path.relative(repositoryRoot, filePath);
    
    for (const pattern of this.patterns) {
      if (minimatch(relativePath, pattern, { dot: true })) {
        return true;
      }
      
      const normalizedPath = relativePath.split(path.sep).join('/');
      if (minimatch(normalizedPath, pattern, { dot: true })) {
        return true;
      }
    }
    
    return false;
  }

  shouldIgnoreDirectory(dirPath: string, repositoryRoot: string): boolean {
    const relativePath = path.relative(repositoryRoot, dirPath);
    for (const pattern of this.patterns) {
      const dirPattern = pattern.endsWith('/**') ? pattern.slice(0, -3) : pattern;
      
      if (minimatch(relativePath, dirPattern, { dot: true })) {
        return true;
      }
      
      const normalizedPath = relativePath.split(path.sep).join('/');
      if (minimatch(normalizedPath, dirPattern, { dot: true })) {
        return true;
      }
      
      if (minimatch(relativePath, pattern, { dot: true, matchBase: true })) {
        return true;
      }
    }
    
    return false;
  }
}
