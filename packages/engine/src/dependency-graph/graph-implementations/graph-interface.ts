import { Cycle, ParsedFile } from "../../types";

export default interface IGraph {
    addNode(node: ParsedFile): void;
    addEdge(from: string, to: string): void;
    
    getInDegree(node: string): number;
    getOutDegree(node: string): number;
    detectCycles(): Cycle[];

    getNodes(): Map<string, ParsedFile>;
    getEdges(): Map<string, Set<string>>;
    getRepositoryRoot(): string;
    
}
