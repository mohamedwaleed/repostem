# Release Process


This document outlines the process for releasing RepoStem.


## Prerequisites

  

- Ensure all changes are committed to `main` branch

- Ensure all tests pass locally (`pnpm test:engine`)

- Ensure build succeeds locally (`pnpm build`)

- Have appropriate permissions to trigger GitHub Actions and create releases

  

## Version Management

  

RepoStem uses [Changesets](https://github.com/changesets/changesets) for version management:

  

- **Fixed packages**: `@repostem/engine` and `@repostem/cli` are versioned together

- **Internal dependencies**: Updated as patch versions automatically

- **Access**: Public npm packages

  

### Adding a Changeset

  

When making changes that should be included in the next release:

  

```bash

pnpm changeset

```

  

Follow the prompts to:

1. Select which packages to include in the changeset

2. Choose the version bump type (major, minor, patch)

3. Add a summary of changes

  

This creates a changeset file in `.changeset/` directory.

  

### Consuming Changesets

  

When ready to release, consume the changesets to update versions:

  

```bash

pnpm changeset version

```

  

This updates `package.json` files and generates CHANGELOG entries.

  

## Release Workflow

  

The release process uses GitHub Actions and is manually triggered.

  

### Steps

  

1. **Update documentation** if needed

  

2. **Trigger Release Workflow**:

- Go to GitHub Actions tab in the repository

- Select "Release" workflow

- Click "Run workflow"

- Fill in the required inputs:

- **Release title**: e.g., "Release v0.2.0"

- **Release notes**: Markdown format describing the release

- **Prerelease**: Check if this is a prerelease (beta, alpha, etc.)

  

3. **Workflow Execution**:

The workflow will automatically:

- Checkout code with full history

- Install pnpm (v10.6.3) and Node.js (v22)

- Install dependencies with frozen lockfile

- Run engine tests (`pnpm test:engine`)

- Build the project (`pnpm build`)

- Read version from root `package.json`

- Create and push git tag (e.g., `v0.2.0`)

- Fetch contributors since last tag

- Create GitHub release with:

- Tag name matching version

- Custom release title

- Custom release notes

- List of new contributors (with @mentions for avatars)

  

4. **Verify Release**:

- Check that the release was created on GitHub

- Verify the tag was pushed correctly

- Check that contributors are listed

- Confirm the release notes are accurate

  

## Post-Release Tasks

  

After a successful release:

  

1. **Publish to npm** (if not automated):

```bash

pnpm changeset publish

```

  

2. **Announce the release** to users/stakeholders

  

## Troubleshooting

  

### Tag Already Exists

  

If the workflow reports "Tag already exists", you may need to delete the existing tag locally and remotely:

  

```bash

git tag -d v0.2.0

git push origin :refs/tags/v0.2.0

```

  

Then re-run the workflow.

  

### Changeset Issues

  

If changesets aren't being consumed properly:

- Ensure changeset files exist in `.changeset/`

- Run `pnpm changeset status` to see pending changesets

- Check that package names in changeset config match actual packages

  

### Test Failures

  

If tests fail during release:

- Run tests locally: `pnpm test:engine`

- Fix any failing tests

- Commit fixes and push

- Re-run the release workflow