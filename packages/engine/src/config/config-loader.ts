import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { DEFAULT_IGNORE_PATTERNS } from './default-ignore-patterns';
import { RepoStemConfig } from '../types';

export function loadConfig(repositoryRoot: string): RepoStemConfig {
  const configPaths = [
    path.join(repositoryRoot, '.repostem.json'),
    path.join(repositoryRoot, 'repostem.config.json')
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent) as RepoStemConfig;
        return {
          respectGitignore: config.respectGitignore ?? true,
          ignore: config.ignore || []
        };
      } catch (error) {
        console.warn(`Failed to parse config file at ${configPath}:`, error);
      }
    }
  }

  return {
    respectGitignore: true,
    ignore: []
  };
}

export function getAllIgnorePatterns(repositoryRoot: string): string[] {
  const config = loadConfig(repositoryRoot);
  const patterns = [...DEFAULT_IGNORE_PATTERNS];

  if (config.ignore && config.ignore.length > 0) {
    patterns.push(...config.ignore);
  }

  if (config.respectGitignore) {
    const gitignorePatterns = loadGitignorePatterns(repositoryRoot);
    patterns.push(...gitignorePatterns);
  }

  return patterns;
}

function loadGitignorePatterns(repositoryRoot: string): string[] {
  const gitignorePath = path.join(repositoryRoot, '.gitignore');
  
  if (!existsSync(gitignorePath)) {
    return [];
  }

  try {
    const content = readFileSync(gitignorePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch (error) {
    console.warn(`Failed to read .gitignore at ${gitignorePath}:`, error);
    return [];
  }
}
