import { describe, it, expect } from 'vitest';
import { IgnoreMatcher } from '../../utils/ignore-matcher';
import path from 'path';

describe('IgnoreMatcher', () => {
  const repositoryRoot = '/Users/test/project';

  describe('shouldIgnore', () => {
    it('should ignore files matching exact patterns', () => {
      const matcher = new IgnoreMatcher(['node_modules/**', 'dist/**']);
      
      expect(matcher.shouldIgnore(
        path.join(repositoryRoot, 'node_modules/package/index.js'),
        repositoryRoot
      )).toBe(true);
      
      expect(matcher.shouldIgnore(
        path.join(repositoryRoot, 'dist/bundle.js'),
        repositoryRoot
      )).toBe(true);
    });

    it('should not ignore files that do not match patterns', () => {
      const matcher = new IgnoreMatcher(['node_modules/**', 'dist/**']);
      
      expect(matcher.shouldIgnore(
        path.join(repositoryRoot, 'src/index.ts'),
        repositoryRoot
      )).toBe(false);
    });

    it('should ignore files matching glob patterns', () => {
      const matcher = new IgnoreMatcher(['**/*.test.ts', '**/*.spec.js']);
      
      expect(matcher.shouldIgnore(
        path.join(repositoryRoot, 'src/utils/helper.test.ts'),
        repositoryRoot
      )).toBe(true);
      
      expect(matcher.shouldIgnore(
        path.join(repositoryRoot, 'tests/unit.spec.js'),
        repositoryRoot
      )).toBe(true);
    });

    it('should handle dot files', () => {
      const matcher = new IgnoreMatcher(['.git/**', '.cache/**']);
      
      expect(matcher.shouldIgnore(
        path.join(repositoryRoot, '.git/config'),
        repositoryRoot
      )).toBe(true);
      
      expect(matcher.shouldIgnore(
        path.join(repositoryRoot, '.cache/data.json'),
        repositoryRoot
      )).toBe(true);
    });
  });

  describe('shouldIgnoreDirectory', () => {
    it('should ignore directories matching patterns', () => {
      const matcher = new IgnoreMatcher(['node_modules/**', 'dist/**']);
      
      expect(matcher.shouldIgnoreDirectory(
        path.join(repositoryRoot, 'node_modules'),
        repositoryRoot
      )).toBe(true);
      
      expect(matcher.shouldIgnoreDirectory(
        path.join(repositoryRoot, 'dist'),
        repositoryRoot
      )).toBe(true);
    });

    it('should not ignore directories that do not match patterns', () => {
      const matcher = new IgnoreMatcher(['node_modules/**', 'dist/**']);
      
      expect(matcher.shouldIgnoreDirectory(
        path.join(repositoryRoot, 'src'),
        repositoryRoot
      )).toBe(false);
    });

    it('should ignore nested directories', () => {
      const matcher = new IgnoreMatcher(['**/__tests__/**']);
      
      expect(matcher.shouldIgnoreDirectory(
        path.join(repositoryRoot, 'src/__tests__'),
        repositoryRoot
      )).toBe(true);
      
      expect(matcher.shouldIgnoreDirectory(
        path.join(repositoryRoot, 'packages/core/__tests__'),
        repositoryRoot
      )).toBe(true);
    });
  });
});
