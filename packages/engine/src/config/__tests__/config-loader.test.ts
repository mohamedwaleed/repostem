import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, getAllIgnorePatterns } from '../config-loader';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import path from 'path';

describe('Config Loader', () => {
  const testDir = path.join(__dirname, 'test-repo');

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('loadConfig', () => {
    it('should return default config when no config file exists', () => {
      const config = loadConfig(testDir);
      
      expect(config.respectGitignore).toBe(true);
      expect(config.ignore).toEqual([]);
    });

    it('should load config from .repostem.json', () => {
      const configPath = path.join(testDir, '.repostem.json');
      writeFileSync(configPath, JSON.stringify({
        ignore: ['legacy/**', 'scripts/**'],
        respectGitignore: false
      }));

      const config = loadConfig(testDir);
      
      expect(config.respectGitignore).toBe(false);
      expect(config.ignore).toEqual(['legacy/**', 'scripts/**']);
    });

    it('should load config from repostem.config.json', () => {
      const configPath = path.join(testDir, 'repostem.config.json');
      writeFileSync(configPath, JSON.stringify({
        ignore: ['temp/**'],
        respectGitignore: true
      }));

      const config = loadConfig(testDir);
      
      expect(config.respectGitignore).toBe(true);
      expect(config.ignore).toEqual(['temp/**']);
    });
  });

  describe('getAllIgnorePatterns', () => {
    it('should include default patterns', () => {
      const patterns = getAllIgnorePatterns(testDir);
      
      expect(patterns).toContain('node_modules/**');
      expect(patterns).toContain('.git/**');
      expect(patterns).toContain('dist/**');
    });

    it('should merge custom patterns with defaults', () => {
      const configPath = path.join(testDir, '.repostem.json');
      writeFileSync(configPath, JSON.stringify({
        ignore: ['custom/**']
      }));

      const patterns = getAllIgnorePatterns(testDir);
      
      expect(patterns).toContain('node_modules/**');
      expect(patterns).toContain('custom/**');
    });

    it('should include gitignore patterns when respectGitignore is true', () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      writeFileSync(gitignorePath, 'build/\n*.log\n# comment\n\ntemp/');

      const patterns = getAllIgnorePatterns(testDir);
      
      expect(patterns).toContain('build/');
      expect(patterns).toContain('*.log');
      expect(patterns).toContain('temp/');
      expect(patterns).not.toContain('# comment');
      expect(patterns).not.toContain('');
    });
  });
});
