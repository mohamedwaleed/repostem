import { Cycle, ParsedFile } from "../../types";
import IGraph from "./graph-interface";

export class InMemoryGraph implements IGraph {

    private nodes: Map<string, ParsedFile> = new Map(); // path -> ParsedFile
    private edges: Map<string, Set<string>> = new Map(); // still use paths for edges
    private cycles: Cycle[] = [];
    private needRecalculation: boolean = true;

    addNode(node: ParsedFile): void {
        this.nodes.set(node.path, node);
        this.needRecalculation = true;
    }
    
    addEdge(from: string, to: string): void {
        if (!this.edges.has(from)) {
            this.edges.set(from, new Set());
        }
        this.edges.get(from)!.add(to);
        this.needRecalculation = true;
    }
    
    getNode(path: string): ParsedFile | undefined {
        return this.nodes.get(path);
    }
 
    getInDegree(node: string): number {
        let count = 0
        for(const [_, dependencies] of this.edges) {
            if(dependencies.has(node)) {
                count++
            }
        }
        return count;
    }

    getOutDegree(node: string): number {
        return this.edges.get(node)?.size || 0;
    }

    getDirectDependent(node: string): string[] {
        let directDependents: string[] = [];
        for(const [file, dependencies] of this.edges) {
            if(dependencies.has(node)) {
                directDependents.push(file);
            }
        }
        return directDependents;
    }

    getTransitiveDependents(node: string): string[] {
        const transitiveDependents: string[] = [];
        const visited: Set<string> = new Set([node]);
        const queue: string[] = [node];
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            
            const dependents = this.getDirectDependent(current);
            for (const dependent of dependents) {
                if (!visited.has(dependent)) {
                    visited.add(dependent);
                    transitiveDependents.push(dependent);
                    queue.push(dependent);
                }
            }
        }
        
        return transitiveDependents;
    }
    
    detectCycles(): Cycle[] {
        if(this.needRecalculation) {
            this.cycles = this.getCycles();
            this.needRecalculation = false;
        }
        return this.cycles;
    }
 

    getNodes(): Map<string, ParsedFile> {
        return this.nodes;
    }
    
    getEdges(): Map<string, Set<string>> {
        return this.edges;
    }


    private getCycles(): Cycle[] {
        const nodes = Array.from(this.nodes.keys());
        if (nodes.length === 0) return [];
        
        const visited: Set<string> = new Set();
        const discoveryTime: Map<string, number> = new Map();
        const lowestReachable: Map<string, number> = new Map();
        const inCurrentPath: Set<string> = new Set();
        const componentStack: string[] = [];
        const stronglyConnectedComponents: Cycle[] = [];
        let time = 0;
        
        for (const startNode of nodes) {
            if (!visited.has(startNode)) {
                time = this.tarjanSCC(startNode, visited, discoveryTime, lowestReachable, inCurrentPath, componentStack, stronglyConnectedComponents, time);
            }
        }
        
        return stronglyConnectedComponents.filter(component => 
            component.nodes.length > 1 || 
            (component.nodes.length === 1 && this.edges.get(component.nodes[0])?.has(component.nodes[0]))
        );
    }

    private tarjanSCC(
        startNode: string,
        visited: Set<string>,
        discoveryTime: Map<string, number>,
        lowestReachable: Map<string, number>,
        inCurrentPath: Set<string>,
        componentStack: string[],
        stronglyConnectedComponents: Cycle[],
        time: number
    ): number {
        const stack: Array<{node: string, visiting: boolean, childIndex: number}> = [
            {node: startNode, visiting: true, childIndex: 0}
        ];

        while (stack.length > 0) {
            const frame = stack[stack.length - 1];
            const {node, visiting, childIndex} = frame;

            if (visiting) {
                visited.add(node);
                discoveryTime.set(node, time);
                lowestReachable.set(node, time);
                time++;
                inCurrentPath.add(node);
                componentStack.push(node);
                frame.visiting = false;
            }

            const neighbors = Array.from(this.edges.get(node) || []);
            
            if (childIndex < neighbors.length) {
                const neighbor = neighbors[childIndex];
                frame.childIndex++;

                if (!visited.has(neighbor)) {
                    stack.push({node: neighbor, visiting: true, childIndex: 0});
                } else if (inCurrentPath.has(neighbor)) {
                    lowestReachable.set(node, Math.min(lowestReachable.get(node)!, discoveryTime.get(neighbor)!));
                }
            } else {
                stack.pop();

                if (stack.length > 0) {
                    const parent = stack[stack.length - 1].node;
                    lowestReachable.set(parent, Math.min(lowestReachable.get(parent)!, lowestReachable.get(node)!));
                }

                if (lowestReachable.get(node) === discoveryTime.get(node)) {
                    const componentNodes: string[] = [];
                    let currentNode: string;
                    do {
                        currentNode = componentStack.pop()!;
                        inCurrentPath.delete(currentNode);
                        componentNodes.push(currentNode);
                    } while (currentNode !== node);
                    
                    stronglyConnectedComponents.push({nodes: componentNodes});
                }
            }
        }

        return time;
    }
}
