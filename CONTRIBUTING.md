# Contributing to RepoStem

Thank you for your interest in contributing to RepoStem! This guide will help you get started.

## Development Setup

### Prerequisites
- Node.js 18+ 
- pnpm (recommended package manager)
- Git

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/repostem.git
   cd repostem
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build the project**
   ```bash
   pnpm build
   ```

4. **Run tests**
   ```bash
   pnpm test:<module> (e.g. pnpm test:engine)
   ```

## Project Structure

```
├── .changeset/     # Version management and changelog
├── .github/
│   └── workflows/  # CI/CD and release automation
├── apps/
│   └── cli/        # CLI application
├── packages/
│   └── engine/     # Core analysis engine
├── examples/       # Sample repositories for testing
└── docs/           # Documentation
```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style (TypeScript strict mode)
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Run tests
   pnpm test:<module> (e.g. pnpm test:engine)
   
   # Build and test CLI locally
   pnpm build
   cd apps/cli
   pnpm dev
   pnpm start analyze /path/to/test/repo
   ```

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep functions focused and small

### Testing

- Unit tests go in `__tests__` directories
- Use the existing test setup with Jest
- Test edge cases and error conditions
- Add integration tests for new CLI commands

## Submitting Changes

### Pull Request Process

1. **Ensure your branch is up to date**
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/your-feature-name
   git rebase main
   ```

2. **Create a pull request**
   - Use descriptive title and description
   - Link any relevant issues
   - Request review from maintainers

3. **PR Requirements**
   - All tests pass
   - Code follows project style
   - Documentation is updated
   - Breaking changes are clearly documented

### Release Process

Releases are managed using **Changesets** for version management and changelog generation.

#### For Contributors

If your change affects the public API or includes user-facing changes:

1. **Add a changeset** after making your changes:
   ```bash
   pnpm changeset
   ```
   
2. **Choose the appropriate version type**:
   - `patch`: Bug fixes, documentation updates
   - `minor`: New features, non-breaking changes
   - `major`: Breaking changes

3. **Write a clear description** of what changed and why

#### For Maintainers

To create a new release:

1. **Ensure all changesets are added** for PRs that need version bumps
2. **Update versions and changelog**:
   ```bash
   pnpm changeset version
   ```
   
3. **Commit the version changes**:
   ```bash
   git add .
   git commit -m "chore: update versions"
   ```
   
4. **Publish to npm**:
   ```bash
   pnpm changeset publish
   ```
   
5. **Create GitHub release**

**Note**: Only maintainers with npm publish permissions can trigger releases.

## Areas for Contribution

### High Priority
- **Language Support**: Add parsers for new languages (Python, Java, etc.)
- **Metrics**: Implement new architectural risk metrics
- **CLI Improvements**: Enhance user experience and output formatting

### Medium Priority
- **Performance**: Optimize parsing for large repositories
- **Documentation**: Improve guides and API docs
- **Testing**: Add more comprehensive test coverage

### Low Priority
- **UI**: Optional web interface
- **Integrations**: IDE plugins, CI/CD integrations
- **Export Formats**: JSON, CSV, other output formats

## Questions?

- Check existing [Issues](https://github.com/mohamedwaleed/repostem/issues)
- Create a new issue for bugs or feature requests
- Join discussions in existing issues

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).
