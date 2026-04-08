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
        // tarjan's algorithm
        const nodes = Array.from(this.nodes.keys());
        if (nodes.length === 0) return [];
        
        const visited: Set<string> = new Set();
        const timeOfInsertion: Map<string, number> = new Map();
        const lowestTimeOfInsertion: Map<string, number> = new Map();
        let time = 1;
        
        for (const startNode of nodes) {
            if (visited.has(startNode)) continue;
            
            const stack: {filePath: string, visiting: boolean}[] = [{filePath: startNode, visiting: true}];
            visited.add(startNode);
            while(stack.length > 0) {
                const node = stack.pop()!;
                const files = this.edges.get(node.filePath) || new Set<string>();
                if(node.visiting) {
                    stack.push({filePath: node.filePath, visiting: false});
                    node.visiting = false;
                    timeOfInsertion.set(node.filePath, time);
                    lowestTimeOfInsertion.set(node.filePath, time);
                    time++;
        
                    for(const file of files) {
                        if(!visited.has(file)) {
                            visited.add(file);
                            stack.push({filePath: file, visiting: true});
                        } else if(timeOfInsertion.has(file)) {
                            lowestTimeOfInsertion.set(node.filePath, Math.min(
                                lowestTimeOfInsertion.get(node.filePath)!,
                                timeOfInsertion.get(file)!
                            ));
                        }
                    }
                } else {
                    for(const file of files) {
                        if(lowestTimeOfInsertion.has(file)) {
                            lowestTimeOfInsertion.set(node.filePath, Math.min(
                                lowestTimeOfInsertion.get(node.filePath)!,
                                lowestTimeOfInsertion.get(file)!
                            ));
                        }
                    }
                }
            }
        }

        const cyclesMap: Map<number, string[]> = new Map();
        for(const node of this.nodes.keys()) {
            const lowestTime = lowestTimeOfInsertion.get(node);
            if(lowestTime !== undefined) {
                if(cyclesMap.has(lowestTime)) {
                    cyclesMap.get(lowestTime)!.push(node);
                } else {
                    cyclesMap.set(lowestTime, [node]);
                }
            }
        }
        
        const cycles: Cycle[] = Array.from(cyclesMap.values())
            .filter(nodes => {
                if (nodes.length <= 1) return false;
                // Verify this is actually a cycle by checking if nodes form a strongly connected component
                for (const node of nodes) {
                    const reachable = this.getReachableNodes(node, new Set(nodes));
                    if (reachable.size !== nodes.length) return false;
                }
                return true;
            })
            .map(nodes => ({nodes}));
        
        // add self-loops detection
        for(const node of this.nodes.keys()) {
            const edges = this.edges.get(node);
            if(edges && edges.has(node)) {
                cycles.push({nodes: [node]});
            }
        }
        
        return cycles;
    }

    private getReachableNodes(start: string, allowedNodes: Set<string>): Set<string> {
        const reachable = new Set<string>();
        const queue = [start];
        reachable.add(start);
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            const neighbors = this.edges.get(current) || new Set<string>();
            
            for (const neighbor of neighbors) {
                if (allowedNodes.has(neighbor) && !reachable.has(neighbor)) {
                    reachable.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        
        return reachable;
    }
}
