import { outputGeneric, OutputFormat, parseOutputFormat } from "./generic-output";
import { enrichProjectAnalysis } from "./analysis-presenter";

export function outputProjectAnalysis(result: any, format: OutputFormat = OutputFormat.TEXT): void {
  const enrichedResult = enrichProjectAnalysis(result);
  const analysisFormat = format === OutputFormat.TEXT ? OutputFormat.ANALYSIS : format;
  outputGeneric(enrichedResult, analysisFormat, { 
    title: "Repository Analysis",
    headers: ["Metric", "Value"] 
  });
}

export function outputFileRisk(result: any, format: OutputFormat = OutputFormat.TEXT): void {
  outputGeneric(result, format, { 
    title: "File Risk Analysis",
    headers: ["Metric", "Value"] 
  });
}

export function outputFileImpact(result: any, format: OutputFormat = OutputFormat.TEXT): void {
  outputGeneric(result, format, { 
    title: "File Impact Analysis",
    headers: ["Metric", "Value"] 
  });
}

export function outputCycles(cycles: any, format: OutputFormat = OutputFormat.TEXT): void {
  outputGeneric(cycles, format, { 
    title: "Circular Dependencies",
    headers: ["Cycle", "Files", "Length"] 
  });
}

export { OutputFormat, parseOutputFormat };