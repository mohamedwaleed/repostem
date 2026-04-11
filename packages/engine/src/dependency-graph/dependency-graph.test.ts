import { describe, it, expect } from 'vitest';
import { buildDependencyGraph } from './dependency-graph';
import { ParseResult, ParsedFile, Language } from '../types';

describe('buildDependencyGraph', () => {
    
    it('should create an empty graph when given empty parse result', () => {
        const parseResult: ParseResult = {
            files: [],
            repositoryRoot: "/test/repo"
        };
        
        const graph = buildDependencyGraph(parseResult);

        expect(graph.getNodes().size).toBe(0);
        expect(graph.getEdges().size).toBe(0);
    });

    it('should add a single file with no dependencies', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/index.ts',
                    syntax: {
                        imports: []
                    },
                    metadata: {
                        size: 100,
                        extension: '.ts'
                    }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);

        expect(graph.getNodes().size).toBe(1);
        expect(graph.getNode('src/index.ts')).toBeDefined();
        expect(graph.getNode('src/index.ts')?.path).toBe('src/index.ts');
        expect(graph.getEdges().size).toBe(0);
    });

    it('should add multiple files with no dependencies', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/file1.ts',
                    syntax: { imports: [] },
                    metadata: { size: 100, extension: '.ts' }
                },
                {
                    path: 'src/file2.ts',
                    syntax: { imports: [] },
                    metadata: { size: 200, extension: '.ts' }
                },
                {
                    path: 'src/file3.ts',
                    syntax: { imports: [] },
                    metadata: { size: 300, extension: '.ts' }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);

        expect(graph.getNodes().size).toBe(3);
        expect(graph.getNode('src/file1.ts')).toBeDefined();
        expect(graph.getNode('src/file2.ts')).toBeDefined();
        expect(graph.getNode('src/file3.ts')).toBeDefined();
        expect(graph.getEdges().size).toBe(0);
    });

    it('should create edges for files with dependencies', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/index.ts',
                    syntax: {
                        imports: [
                            { source: './utils', resolvedPath: 'src/utils.ts', isExternal: false },
                            { source: './config', resolvedPath: 'src/config.ts', isExternal: false }
                        ]
                    },
                    metadata: { size: 100, extension: '.ts' }
                },
                {
                    path: 'src/utils.ts',
                    syntax: { imports: [] },
                    metadata: { size: 200, extension: '.ts' }
                },
                {
                    path: 'src/config.ts',
                    syntax: { imports: [] },
                    metadata: { size: 150, extension: '.ts' }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);
        
        expect(graph.getNodes().size).toBe(3);
        expect(graph.getEdges().size).toBe(1);
        
        const indexEdges = graph.getEdges().get('src/index.ts');
        expect(indexEdges).toBeDefined();
        expect(indexEdges?.size).toBe(2);
        expect(indexEdges?.has('src/utils.ts')).toBe(true);
        expect(indexEdges?.has('src/config.ts')).toBe(true);
    });

    it('should handle chain dependencies (A -> B -> C)', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/a.ts',
                    syntax: { imports: [{ source: './b', resolvedPath: 'src/b.ts', isExternal: false }] },
                    metadata: { size: 100, extension: '.ts' }
                },
                {
                    path: 'src/b.ts',
                    syntax: { imports: [{ source: './c', resolvedPath: 'src/c.ts', isExternal: false }] },
                    metadata: { size: 200, extension: '.ts' }
                },
                {
                    path: 'src/c.ts',
                    syntax: { imports: [] },
                    metadata: { size: 300, extension: '.ts' }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);

        expect(graph.getNodes().size).toBe(3);
        expect(graph.getEdges().size).toBe(2);
        
        const aEdges = graph.getEdges().get('src/a.ts');
        expect(aEdges?.has('src/b.ts')).toBe(true);
        
        const bEdges = graph.getEdges().get('src/b.ts');
        expect(bEdges?.has('src/c.ts')).toBe(true);
    });

    it('should handle circular dependencies (A -> B -> A)', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/a.ts',
                    syntax: { imports: [{ source: './b', resolvedPath: 'src/b.ts', isExternal: false }] },
                    metadata: { size: 100, extension: '.ts' }
                },
                {
                    path: 'src/b.ts',
                    syntax: { imports: [{ source: './a', resolvedPath: 'src/a.ts', isExternal: false }] },
                    metadata: { size: 200, extension: '.ts' }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);

        expect(graph.getNodes().size).toBe(2);
        expect(graph.getEdges().size).toBe(2);
        
        const aEdges = graph.getEdges().get('src/a.ts');
        expect(aEdges?.has('src/b.ts')).toBe(true);
        
        const bEdges = graph.getEdges().get('src/b.ts');
        expect(bEdges?.has('src/a.ts')).toBe(true);
    });

    it('should handle complex circular dependencies (A -> B -> C -> A)', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/a.ts',
                    syntax: { imports: [{ source: './b', resolvedPath: 'src/b.ts', isExternal: false }] },
                    metadata: { size: 100, extension: '.ts' }
                },
                {
                    path: 'src/b.ts',
                    syntax: { imports: [{ source: './c', resolvedPath: 'src/c.ts', isExternal: false }] },
                    metadata: { size: 200, extension: '.ts' }
                },
                {
                    path: 'src/c.ts',
                    syntax: { imports: [{ source: './a', resolvedPath: 'src/a.ts', isExternal: false }] },
                    metadata: { size: 300, extension: '.ts' }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);

        expect(graph.getNodes().size).toBe(3);
        expect(graph.getEdges().size).toBe(3);
        
        expect(graph.getEdges().get('src/a.ts')?.has('src/b.ts')).toBe(true);
        expect(graph.getEdges().get('src/b.ts')?.has('src/c.ts')).toBe(true);
        expect(graph.getEdges().get('src/c.ts')?.has('src/a.ts')).toBe(true);
    });

    it('should handle files with multiple dependencies', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/main.ts',
                    syntax: {
                        imports: [
                            { source: './auth', resolvedPath: 'src/auth.ts', isExternal: false },
                            { source: './db', resolvedPath: 'src/db.ts', isExternal: false },
                            { source: './logger', resolvedPath: 'src/logger.ts', isExternal: false },
                            { source: './config', resolvedPath: 'src/config.ts', isExternal: false }
                        ]
                    },
                    metadata: { size: 500, extension: '.ts' }
                },
                {
                    path: 'src/auth.ts',
                    syntax: { imports: [] },
                    metadata: { size: 100, extension: '.ts' }
                },
                {
                    path: 'src/db.ts',
                    syntax: { imports: [] },
                    metadata: { size: 200, extension: '.ts' }
                },
                {
                    path: 'src/logger.ts',
                    syntax: { imports: [] },
                    metadata: { size: 150, extension: '.ts' }
                },
                {
                    path: 'src/config.ts',
                    syntax: { imports: [] },
                    metadata: { size: 80, extension: '.ts' }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);

        expect(graph.getNodes().size).toBe(5);
        
        const mainEdges = graph.getEdges().get('src/main.ts');
        expect(mainEdges?.size).toBe(4);
        expect(mainEdges?.has('src/auth.ts')).toBe(true);
        expect(mainEdges?.has('src/db.ts')).toBe(true);
        expect(mainEdges?.has('src/logger.ts')).toBe(true);
        expect(mainEdges?.has('src/config.ts')).toBe(true);
    });

    it('should handle shared dependencies (A -> C, B -> C)', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/a.ts',
                    syntax: { imports: [{ source: './shared', resolvedPath: 'src/shared.ts', isExternal: false }] },
                    metadata: { size: 100, extension: '.ts' }
                },
                {
                    path: 'src/b.ts',
                    syntax: { imports: [{ source: './shared', resolvedPath: 'src/shared.ts', isExternal: false }] },
                    metadata: { size: 200, extension: '.ts' }
                },
                {
                    path: 'src/shared.ts',
                    syntax: { imports: [] },
                    metadata: { size: 300, extension: '.ts' }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);

        expect(graph.getNodes().size).toBe(3);
        expect(graph.getEdges().size).toBe(2);
        
        expect(graph.getEdges().get('src/a.ts')?.has('src/shared.ts')).toBe(true);
        expect(graph.getEdges().get('src/b.ts')?.has('src/shared.ts')).toBe(true);
    });

    it('should preserve file metadata in nodes', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/test.ts',
                    syntax: { imports: [] },
                    metadata: {
                        size: 1024,
                        extension: '.ts'
                    }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);

        const node = graph.getNode('src/test.ts');
        expect(node?.metadata.size).toBe(1024);
        expect(node?.metadata.extension).toBe('.ts');
    });

    it('should handle duplicate imports (same file imported multiple times)', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/index.ts',
                    syntax: {
                        imports: [
                            { source: './utils', resolvedPath: 'src/utils.ts', isExternal: false },
                            { source: './utils', resolvedPath: 'src/utils.ts', isExternal: false },
                            { source: './utils', resolvedPath: 'src/utils.ts', isExternal: false }
                        ]
                    },
                    metadata: { size: 100, extension: '.ts' }
                },
                {
                    path: 'src/utils.ts',
                    syntax: { imports: [] },
                    metadata: { size: 200, extension: '.ts' }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);

        const indexEdges = graph.getEdges().get('src/index.ts');
        expect(indexEdges?.size).toBe(1);
        expect(indexEdges?.has('src/utils.ts')).toBe(true);
    });

    it('should handle complex graph with mixed dependencies', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/index.ts',
                    syntax: { imports: [
                            { source: './router', resolvedPath: 'src/router.ts', isExternal: false },
                            { source: './config', resolvedPath: 'src/config.ts', isExternal: false }
                        ] },
                    metadata: { size: 100, extension: '.ts' }
                },
                {
                    path: 'src/router.ts',
                    syntax: { imports: [
                            { source: './controller', resolvedPath: 'src/controller.ts', isExternal: false },
                            { source: './middleware', resolvedPath: 'src/middleware.ts', isExternal: false }
                        ] },
                    metadata: { size: 200, extension: '.ts' }
                },
                {
                    path: 'src/controller.ts',
                    syntax: { imports: [
                            { source: './service', resolvedPath: 'src/service.ts', isExternal: false },
                            { source: './validator', resolvedPath: 'src/validator.ts', isExternal: false }
                        ] },
                    metadata: { size: 300, extension: '.ts' }
                },
                {
                    path: 'src/service.ts',
                    syntax: { imports: [
                            { source: './db', resolvedPath: 'src/db.ts', isExternal: false },
                            { source: './logger', resolvedPath: 'src/logger.ts', isExternal: false }
                        ] },
                    metadata: { size: 400, extension: '.ts' }
                },
                {
                    path: 'src/middleware.ts',
                    syntax: { imports: [{ source: './logger', resolvedPath: 'src/logger.ts', isExternal: false }] },
                    metadata: { size: 150, extension: '.ts' }
                },
                {
                    path: 'src/validator.ts',
                    syntax: { imports: [] },
                    metadata: { size: 100, extension: '.ts' }
                },
                {
                    path: 'src/db.ts',
                    syntax: { imports: [{ source: './config', resolvedPath: 'src/config.ts', isExternal: false }] },
                    metadata: { size: 250, extension: '.ts' }
                },
                {
                    path: 'src/logger.ts',
                    syntax: { imports: [{ source: './config', resolvedPath: 'src/config.ts', isExternal: false }] },
                    metadata: { size: 120, extension: '.ts' }
                },
                {
                    path: 'src/config.ts',
                    syntax: { imports: [] },
                    metadata: { size: 80, extension: '.ts' }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);

        expect(graph.getNodes().size).toBe(9);
        
        expect(graph.getEdges().get('src/index.ts')?.size).toBe(2);
        expect(graph.getEdges().get('src/router.ts')?.size).toBe(2);
        expect(graph.getEdges().get('src/controller.ts')?.size).toBe(2);
        expect(graph.getEdges().get('src/service.ts')?.size).toBe(2);
        expect(graph.getEdges().get('src/middleware.ts')?.size).toBe(1);
        expect(graph.getEdges().get('src/db.ts')?.size).toBe(1);
        expect(graph.getEdges().get('src/logger.ts')?.size).toBe(1);
        
        expect(graph.getEdges().get('src/validator.ts')).toBeUndefined();
        expect(graph.getEdges().get('src/config.ts')).toBeUndefined();
    });

    it('should handle self-referencing file (A -> A)', () => {
        const parseResult: ParseResult = {
            files: [
                {
                    path: 'src/recursive.ts',
                    syntax: { imports: [{ source: './recursive', resolvedPath: 'src/recursive.ts', isExternal: false }] },
                    metadata: { size: 100, extension: '.ts' }
                }
            ],
            repositoryRoot: "/test/repo"
        };

        const graph = buildDependencyGraph(parseResult);

        expect(graph.getNodes().size).toBe(1);
        expect(graph.getEdges().size).toBe(1);
        
        const edges = graph.getEdges().get('src/recursive.ts');
        expect(edges?.has('src/recursive.ts')).toBe(true);
    });
});
