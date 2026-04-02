import path from "path";
import { describe, expect, it } from "vitest";
import parseRepository from "./parser";
import { Language } from "../types";

const sharedFixturesRoot = path.resolve(__dirname, "..", "__tests__", "fixtures", "shared");
const parserFixturesRoot = path.resolve(__dirname, "__tests__/fixtures");
const basicRepoPath = path.join(sharedFixturesRoot, "basic-repo");
const noSupportedFilesPath = path.join(parserFixturesRoot, "no-supported-files");

describe("parseRepository", () => {
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

  it("returns an empty result for repositories without supported files", () => {
    const result = parseRepository(noSupportedFilesPath, { language: Language.typescript });
    expect(result.files).toEqual([]);
  });
});
