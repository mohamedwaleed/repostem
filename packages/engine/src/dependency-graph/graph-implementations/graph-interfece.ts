import { ParsedFile } from "../../types";

export interface IGraph {
    addNode(node: ParsedFile): void;
    addEdge(from: string, to: string): void;
    getNodes(): Map<string, ParsedFile>;
    getEdges(): Map<string, Set<string>>;
}
