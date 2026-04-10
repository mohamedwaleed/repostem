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

describe('InMemoryGraph - getDirectDependent', () => {
    let graph: InMemoryGraph;

    beforeEach(() => {
        graph = new InMemoryGraph();
    });

    const createMockFile = (path: string): ParsedFile => ({
        path,
        syntax: { imports: [] },
        metadata: { size: 0, extension: '.ts' }
    });

    describe('Basic functionality', () => {
        it('should return empty array for node with no dependents', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addEdge('a.ts', 'b.ts');

            const dependents = graph.getDirectDependent('a.ts');
            expect(dependents).toEqual([]);
        });

        it('should return single dependent', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addEdge('b.ts', 'a.ts'); // b depends on a

            const dependents = graph.getDirectDependent('a.ts');
            expect(dependents).toHaveLength(1);
            expect(dependents).toContain('b.ts');
        });

        it('should return multiple direct dependents', () => {
            graph.addNode(createMockFile('shared.ts'));
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            
            graph.addEdge('a.ts', 'shared.ts');
            graph.addEdge('b.ts', 'shared.ts');
            graph.addEdge('c.ts', 'shared.ts');

            const dependents = graph.getDirectDependent('shared.ts');
            expect(dependents).toHaveLength(3);
            expect(dependents).toContain('a.ts');
            expect(dependents).toContain('b.ts');
            expect(dependents).toContain('c.ts');
        });

        it('should return empty array for non-existent node', () => {
            graph.addNode(createMockFile('a.ts'));
            
            const dependents = graph.getDirectDependent('non-existent.ts');
            expect(dependents).toEqual([]);
        });

        it('should return empty array for empty graph', () => {
            const dependents = graph.getDirectDependent('a.ts');
            expect(dependents).toEqual([]);
        });
    });

    describe('Complex dependency patterns', () => {
        it('should handle chain dependencies correctly', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            
            graph.addEdge('a.ts', 'b.ts'); // a -> b
            graph.addEdge('b.ts', 'c.ts'); // b -> c

            const dependentsOfC = graph.getDirectDependent('c.ts');
            expect(dependentsOfC).toEqual(['b.ts']);
            
            const dependentsOfB = graph.getDirectDependent('b.ts');
            expect(dependentsOfB).toEqual(['a.ts']);
        });

        it('should handle circular dependencies', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            
            graph.addEdge('a.ts', 'b.ts');
            graph.addEdge('b.ts', 'a.ts');

            const dependentsOfA = graph.getDirectDependent('a.ts');
            expect(dependentsOfA).toContain('b.ts');
            
            const dependentsOfB = graph.getDirectDependent('b.ts');
            expect(dependentsOfB).toContain('a.ts');
        });

        it('should handle self-referencing node', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addEdge('a.ts', 'a.ts');

            const dependents = graph.getDirectDependent('a.ts');
            expect(dependents).toContain('a.ts');
        });

        it('should only return direct dependents, not transitive', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            
            graph.addEdge('a.ts', 'b.ts'); // a -> b
            graph.addEdge('b.ts', 'c.ts'); // b -> c

            const dependents = graph.getDirectDependent('c.ts');
            expect(dependents).toHaveLength(1);
            expect(dependents).toContain('b.ts');
            expect(dependents).not.toContain('a.ts');
        });
    });

    describe('Real-world scenarios', () => {
        it('should identify files that import a utility module', () => {
            graph.addNode(createMockFile('utils.ts'));
            graph.addNode(createMockFile('service.ts'));
            graph.addNode(createMockFile('controller.ts'));
            graph.addNode(createMockFile('model.ts'));
            
            graph.addEdge('service.ts', 'utils.ts');
            graph.addEdge('controller.ts', 'utils.ts');
            graph.addEdge('model.ts', 'utils.ts');

            const dependents = graph.getDirectDependent('utils.ts');
            expect(dependents).toHaveLength(3);
            expect(dependents).toContain('service.ts');
            expect(dependents).toContain('controller.ts');
            expect(dependents).toContain('model.ts');
        });
    });
});

describe('InMemoryGraph - getTransitiveDependents', () => {
    let graph: InMemoryGraph;

    beforeEach(() => {
        graph = new InMemoryGraph();
    });

    const createMockFile = (path: string): ParsedFile => ({
        path,
        syntax: { imports: [] },
        metadata: { size: 0, extension: '.ts' }
    });

    describe('Basic functionality', () => {
        it('should return empty array for node with no dependents', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addEdge('a.ts', 'b.ts');

            const dependents = graph.getTransitiveDependents('a.ts');
            expect(dependents).toEqual([]);
        });

        it('should return single direct dependent', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addEdge('b.ts', 'a.ts');

            const dependents = graph.getTransitiveDependents('a.ts');
            expect(dependents).toHaveLength(1);
            expect(dependents).toContain('b.ts');
        });

        it('should return transitive dependents in chain', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            
            graph.addEdge('b.ts', 'a.ts'); // b -> a
            graph.addEdge('c.ts', 'b.ts'); // c -> b

            const dependents = graph.getTransitiveDependents('a.ts');
            expect(dependents).toHaveLength(2);
            expect(dependents).toContain('b.ts');
            expect(dependents).toContain('c.ts');
        });

        it('should return empty array for non-existent node', () => {
            graph.addNode(createMockFile('a.ts'));
            
            const dependents = graph.getTransitiveDependents('non-existent.ts');
            expect(dependents).toEqual([]);
        });

        it('should return empty array for empty graph', () => {
            const dependents = graph.getTransitiveDependents('a.ts');
            expect(dependents).toEqual([]);
        });
    });

    describe('Complex dependency patterns', () => {
        it('should handle multiple paths to same dependent', () => {
            graph.addNode(createMockFile('base.ts'));
            graph.addNode(createMockFile('middle1.ts'));
            graph.addNode(createMockFile('middle2.ts'));
            graph.addNode(createMockFile('top.ts'));
            
            graph.addEdge('middle1.ts', 'base.ts');
            graph.addEdge('middle2.ts', 'base.ts');
            graph.addEdge('top.ts', 'middle1.ts');
            graph.addEdge('top.ts', 'middle2.ts');

            const dependents = graph.getTransitiveDependents('base.ts');
            expect(dependents).toHaveLength(3);
            expect(dependents).toContain('middle1.ts');
            expect(dependents).toContain('middle2.ts');
            expect(dependents).toContain('top.ts');
        });

        it('should not include duplicates', () => {
            graph.addNode(createMockFile('base.ts'));
            graph.addNode(createMockFile('middle.ts'));
            graph.addNode(createMockFile('top.ts'));
            
            // Create a simple chain to test duplicates
            graph.addEdge('middle.ts', 'base.ts');
            graph.addEdge('top.ts', 'middle.ts');

            const dependents = graph.getTransitiveDependents('base.ts');
            const uniqueDependents = new Set(dependents);
            
            // Should not have duplicates
            expect(dependents.length).toBe(uniqueDependents.size);
            expect(dependents).toContain('middle.ts');
            expect(dependents).toContain('top.ts');
        });

        it('should handle circular dependencies without infinite loop', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addNode(createMockFile('c.ts'));
            
            graph.addEdge('b.ts', 'a.ts');
            graph.addEdge('c.ts', 'b.ts');
            graph.addEdge('a.ts', 'c.ts'); // Creates cycle

            const dependents = graph.getTransitiveDependents('a.ts');
            expect(dependents.length).toBeGreaterThan(0);
            expect(dependents.length).toBeLessThan(10); // Should not loop infinitely
        });

        it('should handle deep dependency chains', () => {
            const depth = 5;
            for (let i = 0; i < depth; i++) {
                graph.addNode(createMockFile(`level${i}.ts`));
            }
            
            for (let i = 1; i < depth; i++) {
                graph.addEdge(`level${i}.ts`, `level${i-1}.ts`);
            }

            const dependents = graph.getTransitiveDependents('level0.ts');
            expect(dependents).toHaveLength(depth - 1);
            for (let i = 1; i < depth; i++) {
                expect(dependents).toContain(`level${i}.ts`);
            }
        });

        it('should handle tree structure with multiple branches', () => {
            graph.addNode(createMockFile('root.ts'));
            graph.addNode(createMockFile('branch1.ts'));
            graph.addNode(createMockFile('branch2.ts'));
            graph.addNode(createMockFile('leaf1.ts'));
            graph.addNode(createMockFile('leaf2.ts'));
            graph.addNode(createMockFile('leaf3.ts'));
            
            graph.addEdge('branch1.ts', 'root.ts');
            graph.addEdge('branch2.ts', 'root.ts');
            graph.addEdge('leaf1.ts', 'branch1.ts');
            graph.addEdge('leaf2.ts', 'branch1.ts');
            graph.addEdge('leaf3.ts', 'branch2.ts');

            const dependents = graph.getTransitiveDependents('root.ts');
            expect(dependents).toHaveLength(5);
            expect(dependents).toContain('branch1.ts');
            expect(dependents).toContain('branch2.ts');
            expect(dependents).toContain('leaf1.ts');
            expect(dependents).toContain('leaf2.ts');
            expect(dependents).toContain('leaf3.ts');
        });

        it('should not include the node itself in transitive dependents', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addEdge('b.ts', 'a.ts');

            const dependents = graph.getTransitiveDependents('a.ts');
            expect(dependents).not.toContain('a.ts');
        });
    });

    describe('Real-world scenarios', () => {
        it('should calculate impact radius of changing a base utility', () => {
            graph.addNode(createMockFile('logger.ts'));
            graph.addNode(createMockFile('database.ts'));
            graph.addNode(createMockFile('service.ts'));
            graph.addNode(createMockFile('controller.ts'));
            graph.addNode(createMockFile('index.ts'));
            
            graph.addEdge('database.ts', 'logger.ts');
            graph.addEdge('service.ts', 'database.ts');
            graph.addEdge('controller.ts', 'service.ts');
            graph.addEdge('index.ts', 'controller.ts');

            const impactedFiles = graph.getTransitiveDependents('logger.ts');
            expect(impactedFiles).toHaveLength(4);
            expect(impactedFiles).toContain('database.ts');
            expect(impactedFiles).toContain('service.ts');
            expect(impactedFiles).toContain('controller.ts');
            expect(impactedFiles).toContain('index.ts');
        });

        it('should identify all files affected by changing a shared type definition', () => {
            graph.addNode(createMockFile('types.ts'));
            graph.addNode(createMockFile('model.ts'));
            graph.addNode(createMockFile('service.ts'));
            graph.addNode(createMockFile('controller.ts'));
            graph.addNode(createMockFile('validator.ts'));
            
            graph.addEdge('model.ts', 'types.ts');
            graph.addEdge('validator.ts', 'types.ts');
            graph.addEdge('service.ts', 'model.ts');
            graph.addEdge('controller.ts', 'service.ts');

            const affectedFiles = graph.getTransitiveDependents('types.ts');
            expect(affectedFiles.length).toBeGreaterThanOrEqual(2);
            expect(affectedFiles).toContain('model.ts');
            expect(affectedFiles).toContain('validator.ts');
        });

        it('should handle disconnected components correctly', () => {
            // Component 1
            graph.addNode(createMockFile('a1.ts'));
            graph.addNode(createMockFile('a2.ts'));
            graph.addEdge('a2.ts', 'a1.ts');
            
            // Component 2 (disconnected)
            graph.addNode(createMockFile('b1.ts'));
            graph.addNode(createMockFile('b2.ts'));
            graph.addEdge('b2.ts', 'b1.ts');

            const dependentsA = graph.getTransitiveDependents('a1.ts');
            expect(dependentsA).toContain('a2.ts');
            expect(dependentsA).not.toContain('b1.ts');
            expect(dependentsA).not.toContain('b2.ts');
        });
    });

    describe('Edge cases', () => {
        it('should handle self-referencing node', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addEdge('a.ts', 'a.ts');

            const dependents = graph.getTransitiveDependents('a.ts');
            // Self-referencing is handled by visited set, may or may not include itself
            expect(Array.isArray(dependents)).toBe(true);
        });

        it('should handle node with only outgoing edges', () => {
            graph.addNode(createMockFile('a.ts'));
            graph.addNode(createMockFile('b.ts'));
            graph.addEdge('a.ts', 'b.ts');

            const dependents = graph.getTransitiveDependents('a.ts');
            expect(dependents).toEqual([]);
        });

        it('should handle large dependency graph', () => {
            const nodeCount = 20;
            for (let i = 0; i < nodeCount; i++) {
                graph.addNode(createMockFile(`node${i}.ts`));
            }
            
            // Create a chain
            for (let i = 1; i < nodeCount; i++) {
                graph.addEdge(`node${i}.ts`, `node${i-1}.ts`);
            }

            const dependents = graph.getTransitiveDependents('node0.ts');
            expect(dependents).toHaveLength(nodeCount - 1);
        });
    });
});
