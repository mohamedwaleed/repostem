import { ParsedFile } from "../../types";
import { IGraph } from "./graph-interfece";

export class InMemoryGraph implements IGraph {
    private nodes: Map<string, ParsedFile> = new Map(); // path -> ParsedFile
    private edges: Map<string, Set<string>> = new Map(); // still use paths for edges

    addNode(node: ParsedFile): void {
        this.nodes.set(node.path, node);
    }
    
    addEdge(from: string, to: string): void {
        if (!this.edges.has(from)) {
            this.edges.set(from, new Set());
        }
        this.edges.get(from)!.add(to);
    }
    
    getNode(path: string): ParsedFile | undefined {
        return this.nodes.get(path);
    }
    
    getNodes(): Map<string, ParsedFile> {
        return this.nodes;
    }
    
    getEdges(): Map<string, Set<string>> {
        return this.edges;
    }
}