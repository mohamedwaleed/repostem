import { Language } from "../types";

/**
 * Centralized file extension configuration
 */
export const SUPPORTED_EXTENSIONS = {
  typescript: ['.ts', '.tsx'] as const,
  javascript: ['.js', '.jsx', '.mjs', '.cjs'] as const,
} as const;

/**
 * All supported file extensions across all languages
 */
export const ALL_SUPPORTED_EXTENSIONS = [
  ...SUPPORTED_EXTENSIONS.typescript,
  ...SUPPORTED_EXTENSIONS.javascript,
] as const;

/**
 * Check if a file extension is supported for parsing
 */
export function isSupportedExtension(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  return ALL_SUPPORTED_EXTENSIONS.includes(ext as typeof ALL_SUPPORTED_EXTENSIONS[number]);
}

/**
 * Get the file extension from a file path
 */
export function getFileExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  return lastDot !== -1 ? filePath.slice(lastDot) : '';
}

/**
 * Get the language associated with a file extension
 */
export function getLanguageFromExtension(filePath: string): Language | null {
  const ext = getFileExtension(filePath);
  
  if (SUPPORTED_EXTENSIONS.typescript.includes(ext as any)) {
    return Language.typescript;
  }
  
  if (SUPPORTED_EXTENSIONS.javascript.includes(ext as any)) {
    return Language.javascript;
  }
  
  return null;
}

/**
 * Get all supported extensions for a specific language
 */
export function getExtensionsForLanguage(language: Language): readonly string[] {
  return SUPPORTED_EXTENSIONS[language];
}
