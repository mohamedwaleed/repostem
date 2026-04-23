import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { DEFAULT_IGNORE_PATTERNS } from './default-ignore-patterns';
import { RepoStemConfig } from '../types';

const CONFIG_FILE_NAME = '.repostem.json';
const ALTERNATIVE_CONFIG_FILE_NAME = 'repostem.config.json';

/**
 * Get the path to the config file
 * Checks for .repostem.json first, then repostem.config.json as fallback
 */
function getConfigPath(repositoryRoot: string): string {
  const primaryPath = path.join(repositoryRoot, CONFIG_FILE_NAME);
  const alternativePath = path.join(repositoryRoot, ALTERNATIVE_CONFIG_FILE_NAME);
  
  if (existsSync(primaryPath)) {
    return primaryPath;
  }
  
  if (existsSync(alternativePath)) {
    return alternativePath;
  }
  
  return primaryPath;
}

/**
 * Check if a config file exists
 * @param repositoryRoot - The root path of the repository
 * @returns True if config file exists
 */
export function checkConfigFile(repositoryRoot: string): boolean {
  const primaryPath = path.join(repositoryRoot, CONFIG_FILE_NAME);
  const alternativePath = path.join(repositoryRoot, ALTERNATIVE_CONFIG_FILE_NAME);
  return existsSync(primaryPath) || existsSync(alternativePath);
}

/**
 * Load the config file (alias for getConfig for backward compatibility)
 * @param repositoryRoot - The root path of the repository
 * @returns The config object
 */
export function loadConfig(repositoryRoot: string): RepoStemConfig {
  return getConfig(repositoryRoot);
}

/**
 * Get the full config object
 * @param repositoryRoot - The root path of the repository
 * @returns The config object
 */
export function getConfig(repositoryRoot: string): RepoStemConfig {
  const configPath = getConfigPath(repositoryRoot);

  if (existsSync(configPath)) {
    try {
      const configContent = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent) as RepoStemConfig;
      return {
        respectGitignore: config.respectGitignore ?? true,
        ignore: config.ignore || [],
        storage_type: config.storage_type,
        storage_path: config.storage_path,
        repo_id: config.repo_id,
      };
    } catch (error) {
      console.warn(`Failed to parse config file at ${configPath}:`, error);
    }
  }

  return {
    respectGitignore: true,
    ignore: [],
  };
}

/**
 * Create a new config file
 * @param repositoryRoot - The root path of the repository
 * @param config - The config to write
 * @returns The path to the created config file
 */
export function createConfigFile(
  repositoryRoot: string,
  config: Partial<RepoStemConfig>
): string {
  const configPath = getConfigPath(repositoryRoot);
  
  // Ensure directory exists
  const dir = path.dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const fullConfig: RepoStemConfig = {
    respectGitignore: config.respectGitignore ?? true,
    ignore: config.ignore || [],
    storage_type: config.storage_type,
    storage_path: config.storage_path,
    repo_id: config.repo_id,
  };

  writeFileSync(configPath, JSON.stringify(fullConfig, null, 2), 'utf-8');
  return configPath;
}

/**
 * Update an existing config file (merge with existing)
 * @param repositoryRoot - The root path of the repository
 * @param updates - The config updates to merge
 * @returns The path to the updated config file
 */
export function updateConfigFile(
  repositoryRoot: string,
  updates: Partial<RepoStemConfig>
): string {
  const existingConfig = getConfig(repositoryRoot);
  const mergedConfig: RepoStemConfig = {
    ...existingConfig,
    ...updates,
  };

  // Preserve ignore patterns if not explicitly overwritten
  if (!updates.ignore && existingConfig.ignore) {
    mergedConfig.ignore = existingConfig.ignore;
  }

  return createConfigFile(repositoryRoot, mergedConfig);
}

/**
 * Add or update a single config key
 * @param repositoryRoot - The root path of the repository
 * @param key - The config key to update
 * @param value - The value to set
 * @returns The path to the updated config file
 */
export function addConfig(
  repositoryRoot: string,
  key: keyof RepoStemConfig,
  value: any
): string {
  return updateConfigFile(repositoryRoot, { [key]: value });
}

/**
 * Check if persistence is configured
 * @param repositoryRoot - The root path of the repository
 * @returns True if storage_type, storage_path, and repo_id are set
 */
export function isPersistenceConfigured(repositoryRoot: string): boolean {
  const config = getConfig(repositoryRoot);
  return !!(config.storage_type && config.storage_path && config.repo_id);
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
