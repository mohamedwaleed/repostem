import path from "path";
import { describe, expect, it } from "vitest";
import parseRepository from "./parser";
import { Language } from "../types";

const sharedFixturesRoot = path.resolve(__dirname, "..", "__tests__", "fixtures", "shared");
const parserFixturesRoot = path.resolve(__dirname, "__tests__/fixtures");
const basicRepoPath = path.join(sharedFixturesRoot, "basic-repo");
const noSupportedFilesPath = path.join(parserFixturesRoot, "no-supported-files");
const mixedLangRepoPath = path.join(parserFixturesRoot, "mixed-lang-repo");

describe("parseRepository", () => {
  describe("Error Handling", () => {
    it("throws when project path is missing", () => {
      expect(() => parseRepository("" as string)).toThrow("Project path is required");
    });

    it("throws when project path does not exist", () => {
      expect(() => parseRepository(path.join(parserFixturesRoot, "missing-repo"))).toThrow("Project path does not exist");
    });

    it("throws when project path is not a directory", () => {
      const filePath = path.join(basicRepoPath, "src", "index.ts");
      expect(() => parseRepository(filePath)).toThrow("Project path must be a directory");
    });

    it("returns an empty result for repositories without supported files", () => {
      const result = parseRepository(noSupportedFilesPath, { language: Language.typescript });
      expect(result.files).toEqual([]);
    });
  });

  describe("TypeScript Parsing", () => {
    it("parses only supported file extensions", () => {
      const result = parseRepository(basicRepoPath, { language: Language.typescript });
      const parsedPaths = result.files.map(file => file.path).sort();

      expect(parsedPaths).toEqual([
        path.join("src", "empty.ts"),
        path.join("src", "index.ts"),
        path.join("src", "utils", "helper.ts"),
      ]);
    });

    it("extracts imports and resolves internal import paths", () => {
      const result = parseRepository(basicRepoPath, { language: Language.typescript });
      const indexFile = result.files.find(file => file.path === path.join("src", "index.ts"));

      expect(indexFile).toBeDefined();
      expect(indexFile?.syntax.imports).toHaveLength(2);

      const internalImport = indexFile?.syntax.imports.find((item: any) => item.source === "./utils/helper");
      expect(internalImport).toBeDefined();
      expect(internalImport.isExternal).toBe(false);
      expect(internalImport.resolvedPath).toBe(path.join("src", "utils", "helper.ts"));

      const externalImport = indexFile?.syntax.imports.find((item: any) => item.source === "fs");
      expect(externalImport).toBeDefined();
      expect(externalImport.isExternal).toBe(true);
      expect(externalImport.resolvedPath).toBeNull();
    });

    it("parses mixed TypeScript and JavaScript repositories", () => {
      const result = parseRepository(mixedLangRepoPath, { language: Language.typescript });
      const parsedPaths = result.files.map(file => file.path).sort();

      // Should include both .ts and .js files
      expect(parsedPaths).toContain(path.join("src", "index.ts"));
      expect(parsedPaths).toContain(path.join("src", "services", "user-service.ts"));
      expect(parsedPaths).toContain(path.join("src", "services", "database-service.ts"));
      expect(parsedPaths).toContain(path.join("src", "utils", "logger.ts"));
      expect(parsedPaths).toContain(path.join("src", "js-module.js"));
      expect(parsedPaths).toContain(path.join("src", "utils", "js-helper.js"));
      expect(parsedPaths).toContain(path.join("src", "legacy-legacy.js"));

      // Should have 7 files total
      expect(parsedPaths).toHaveLength(7);
    });

    it("extracts imports from both TypeScript and JavaScript files", () => {
      const result = parseRepository(mixedLangRepoPath, { language: Language.typescript });

      // Check TypeScript file imports
      const tsIndexFile = result.files.find(file => file.path === path.join("src", "index.ts"));
      expect(tsIndexFile).toBeDefined();
      expect(tsIndexFile?.syntax.imports.length).toBeGreaterThan(0);

      // Check JavaScript file imports
      const jsModuleFile = result.files.find(file => file.path === path.join("src", "js-module.js"));
      expect(jsModuleFile).toBeDefined();

      expect(jsModuleFile?.syntax.imports.length).toBeGreaterThan(0);
    });

    it("correctly resolves cross-language imports in mixed repository", () => {
      const result = parseRepository(mixedLangRepoPath, { language: Language.typescript });
      const indexFile = result.files.find(file => file.path === path.join("src", "index.ts"));

      expect(indexFile).toBeDefined();
      expect(indexFile?.syntax.imports).toHaveLength(3);

      // Check TypeScript import resolution
      const userServiceImport = indexFile?.syntax.imports.find((item: any) => item.source === "./services/user-service");
      expect(userServiceImport).toBeDefined();
      expect(userServiceImport.isExternal).toBe(false);
      expect(userServiceImport.resolvedPath).toBe(path.join("src", "services", "user-service.ts"));

      // Check utility import resolution
      const loggerImport = indexFile?.syntax.imports.find((item: any) => item.source === "./utils/logger");
      expect(loggerImport).toBeDefined();
      expect(loggerImport.isExternal).toBe(false);
      expect(loggerImport.resolvedPath).toBe(path.join("src", "utils", "logger.ts"));

      // Check side-effect import (JavaScript file)
      const jsModuleImport = indexFile?.syntax.imports.find((item: any) => item.source === "./js-module");
      expect(jsModuleImport).toBeDefined();
      expect(jsModuleImport.isExternal).toBe(false);
      expect(jsModuleImport.resolvedPath).toBe(path.join("src", "js-module.js"));
    });
  });
});
