import { ISyntaxProcessor, SyntaxProcessorResult, SyntaxProcessorContext } from "./syntax-processor";
import Parser from "tree-sitter";
import { ParsedSyntax } from "../../types";

/**
 * Generic orchestrator for syntax processors.
 * This is CORE code — it has no knowledge of any specific language.
 * Each language parser creates an instance and registers its own processors.
 */
export class SyntaxProcessorFactory {
  private processors: Map<string, ISyntaxProcessor> = new Map();

  constructor(processors: ISyntaxProcessor[] = []) {
    for (const processor of processors) {
      this.register(processor);
    }
  }

  /**
   * Register a new syntax processor (open for extension)
   */
  register(processor: ISyntaxProcessor): void {
    this.processors.set(processor.syntaxType, processor);
  }

  /**
   * Process all syntax nodes using registered processors
   */
  processAll(nodes: Parser.SyntaxNode[], context: SyntaxProcessorContext): ParsedSyntax {
    const result: SyntaxProcessorResult = {};

    // Group nodes by syntax type
    const nodesByType = new Map<string, Parser.SyntaxNode[]>();
    for (const node of nodes) {
      const type = node.type;
      if (!nodesByType.has(type)) {
        nodesByType.set(type, []);
      }
      nodesByType.get(type)!.push(node);
    }

    // Process each node type with its corresponding processor
    for (const [syntaxType, nodeList] of nodesByType) {
      const processor = this.processors.get(syntaxType);
      if (processor) {
        const processedItems = nodeList
          .map(node => processor.process(node, context))
          .filter((item): item is any => item !== null);

        // Add processed items to result using the syntax type as key
        if (!result[syntaxType]) {
          result[syntaxType] = [];
        }
        result[syntaxType].push(...processedItems);
      }
    }
    
    return result;
  }
}
