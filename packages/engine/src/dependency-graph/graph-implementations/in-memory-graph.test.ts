import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryGraph } from './In-memory-graph';
import { ParsedFile } from '../../types';

describe('InMemoryGraph - detectCycles', () => {
    let graph: InMemoryGraph;

    beforeEach(() => {
        graph = new InMemoryGraph();
    });

    const createMockFile = (path: string): ParsedFile => ({
        path,
        syntax: { imports: [] },
        metadata: { size: 0, extension: '.ts' }
    });

    describe('No cycles', () => {
        it('should return empty array for empty graph', () => {
            const cycles = graph.detectCycles();
            expect(cycles).toEqual([]);
        });

        it('should return empty array for single node with no edges', () => {
            graph.addNode(createMockFile('a.ts'));
            const cycles = graph.detectCycles();
            expect(cycles).toEqual([]);
        });

        it('should return empty array for linear dependency chain', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'c.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toEqual([]);
        });

        it('should return empty array for tree structure', () => {
            graph.addNode(createMockFile('root.ts'));
            graph.addNode(createMockFile('child1.ts'));
            graph.addNode(createMockFile('child2.ts'));
            graph.addNode(createMockFile('grandchild1.ts'));
            
            graph.addEdge('root.ts', 'child1.ts');
            graph.addEdge('root.ts', 'child2.ts');
            graph.addEdge('child1.ts', 'grandchild1.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toEqual([]);
        });

        it('should return empty array for disconnected acyclic components', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            graph.addNode(createMockFile('d.ts'));
            
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('c.ts', 'd.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toEqual([]);
        });
    });

    describe('Simple cycles', () => {
        it('should detect self-loop (node pointing to itself)', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addEdge('a.ts', 'a.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(1);
            expect(cycles[0].nodes).toContain('a.ts');
        });

        it('should detect simple 2-node cycle', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'a.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(1);
            expect(cycles[0].nodes).toHaveLength(2);
            expect(cycles[0].nodes).toContain('a.ts');
            expect(cycles[0].nodes).toContain('b.ts');
        });

        it('should detect simple 3-node cycle', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'c.ts');
            graph.addEdge('c.ts', 'a.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(1);
            expect(cycles[0].nodes).toHaveLength(3);
            expect(cycles[0].nodes).toContain('a.ts');
            expect(cycles[0].nodes).toContain('b.ts');
            expect(cycles[0].nodes).toContain('c.ts');
        });

        it('should detect 4-node cycle', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            graph.addNode(createMockFile('d.ts'));
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'c.ts');
            graph.addEdge('c.ts', 'd.ts');
            graph.addEdge('d.ts', 'a.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(1);
            expect(cycles[0].nodes).toHaveLength(4);
        });
    });

    describe('Multiple cycles', () => {
        it('should detect two separate 2-node cycles', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            graph.addNode(createMockFile('d.ts'));
            
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'a.ts');
            graph.addEdge('c.ts', 'd.ts');
            graph.addEdge('d.ts', 'c.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(2);
        });

        it('should detect multiple cycles in disconnected components', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            graph.addNode(createMockFile('x.ts'));
            graph.addNode(createMockFile('y.ts'));
            graph.addNode(createMockFile('z.ts'));
            
            // First cycle: a -> b -> c -> a
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'c.ts');
            graph.addEdge('c.ts', 'a.ts');
            
            // Second cycle: x -> y -> z -> x
            graph.addEdge('x.ts', 'y.ts');
            graph.addEdge('y.ts', 'z.ts');
            graph.addEdge('z.ts', 'x.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(2);
        });
    });

    describe('Complex cycle scenarios', () => {
        it('should detect cycle with additional acyclic branches', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            graph.addNode(createMockFile('d.ts'));
            
            // Cycle: a -> b -> c -> a
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'c.ts');
            graph.addEdge('c.ts', 'a.ts');
            
            // Acyclic branch from b
            graph.addEdge('b.ts', 'd.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(1);
            expect(cycles[0].nodes).toHaveLength(3);
            expect(cycles[0].nodes).toContain('a.ts');
            expect(cycles[0].nodes).toContain('b.ts');
            expect(cycles[0].nodes).toContain('c.ts');
            expect(cycles[0].nodes).not.toContain('d.ts');
        });

        it('should detect nested cycles (cycle within larger cycle)', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            graph.addNode(createMockFile('d.ts'));
            
            // Outer cycle: a -> b -> c -> d -> a
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'c.ts');
            graph.addEdge('c.ts', 'd.ts');
            graph.addEdge('d.ts', 'a.ts');
            
            // Inner cycle: b -> c -> b
            graph.addEdge('c.ts', 'b.ts');

            const cycles = graph.detectCycles();
            expect(cycles.length).toBeGreaterThan(0);
        });

        it('should handle diamond pattern without cycle', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            graph.addNode(createMockFile('d.ts'));
            
            // Diamond: a -> b, a -> c, b -> d, c -> d
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('a.ts', 'c.ts');
            graph.addEdge('b.ts', 'd.ts');
            graph.addEdge('c.ts', 'd.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toEqual([]);
        });

        it('should detect cycle in diamond pattern with back edge', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            graph.addNode(createMockFile('d.ts'));
            
            // Diamond with cycle
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('a.ts', 'c.ts');
            graph.addEdge('b.ts', 'd.ts');
            graph.addEdge('c.ts', 'd.ts');
            graph.addEdge('d.ts', 'a.ts'); // Creates cycle

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(1);
        });
    });

    describe('Edge cases', () => {
        it('should handle graph with isolated nodes', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('isolated.ts'));
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'a.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(1);
            expect(cycles[0].nodes).not.toContain('isolated.ts');
        });

        it('should handle large cycle', () => {
            const nodeCount = 10;
            for (let i = 0; i < nodeCount; i++) {
                graph.addNode(createMockFile(`node${i}.ts`));
            }
            
            for (let i = 0; i < nodeCount; i++) {
                const next = (i + 1) % nodeCount;
                graph.addEdge(`node${i}.ts`, `node${next}.ts`);
            }

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(1);
            expect(cycles[0].nodes).toHaveLength(nodeCount);
        });

        it('should handle multiple edges between same nodes', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            
            // Adding same edge multiple times (should be deduplicated by Set)
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'a.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(1);
        });
    });

    describe('Caching behavior', () => {
        it('should cache results and not recalculate if graph unchanged', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'a.ts');

            const cycles1 = graph.detectCycles();
            const cycles2 = graph.detectCycles();
            
            expect(cycles1).toBe(cycles2); // Should be same reference (cached)
        });

        it('should recalculate when node is added', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'a.ts');

            const cycles1 = graph.detectCycles();
            
            graph.addNode(createMockFile('c.ts'));
            const cycles2 = graph.detectCycles();
            
            expect(cycles1).not.toBe(cycles2); // Should be different reference
        });

        it('should recalculate when edge is added', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            graph.addEdge('a.ts', 'b.ts');

            const cycles1 = graph.detectCycles();
            expect(cycles1).toEqual([]);
            
            graph.addEdge('b.ts', 'a.ts');
            const cycles2 = graph.detectCycles();
            
            expect(cycles2).toHaveLength(1);
        });
    });

    describe('Real-world scenarios', () => {
        it('should detect circular dependency in module imports', () => {
            graph.addNode(createMockFile('UserService.ts'));
            graph.addNode(createMockFile('AuthService.ts'));
            graph.addNode(createMockFile('DatabaseService.ts'));
            
            // UserService imports AuthService
            graph.addEdge('UserService.ts', 'AuthService.ts');
            // AuthService imports DatabaseService
            graph.addEdge('AuthService.ts', 'DatabaseService.ts');
            // DatabaseService imports UserService (creates cycle)
            graph.addEdge('DatabaseService.ts', 'UserService.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(1);
            expect(cycles[0].nodes).toContain('UserService.ts');
            expect(cycles[0].nodes).toContain('AuthService.ts');
            expect(cycles[0].nodes).toContain('DatabaseService.ts');
        });

        it('should handle complex dependency graph with mixed cycles and acyclic paths', () => {
            // Create a realistic scenario
            graph.addNode(createMockFile('index.ts'));
            graph.addNode(createMockFile('utils.ts'));
            graph.addNode(createMockFile('config.ts'));
            graph.addNode(createMockFile('service.ts'));
            graph.addNode(createMockFile('controller.ts'));
            graph.addNode(createMockFile('model.ts'));
            
            // Acyclic dependencies
            graph.addEdge('index.ts', 'controller.ts');
            graph.addEdge('controller.ts', 'service.ts');
            graph.addEdge('service.ts', 'model.ts');
            graph.addEdge('index.ts', 'config.ts');
            graph.addEdge('service.ts', 'utils.ts');
            
            // Create a cycle: model -> controller
            graph.addEdge('model.ts', 'controller.ts');

            const cycles = graph.detectCycles();
            expect(cycles).toHaveLength(1);
            expect(cycles[0].nodes).toContain('controller.ts');
            expect(cycles[0].nodes).toContain('service.ts');
            expect(cycles[0].nodes).toContain('model.ts');
        });
    });
});
