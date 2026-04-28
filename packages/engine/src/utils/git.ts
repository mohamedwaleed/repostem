import simpleGit from 'simple-git';

/**
 * Detect the current git branch
 */
export async function detectBranch(repoPath: string): Promise<string | null> {
    try {
        const git = simpleGit(repoPath);
        const status = await git.status();
        return status.current || null;
    } catch {
        return null;
    }
}

/**
 * Detect the current commit hash
 */
export async function detectCommitHash(repoPath: string): Promise<string | null> {
    try {
        const git = simpleGit(repoPath);
        const log = await git.log(['-1']);
        return log.latest?.hash || null;
    } catch {
        return null;
    }
}

/**
 * Detect if the repository has uncommitted changes
 */
export async function detectDirtyState(repoPath: string): Promise<boolean> {
    try {
        const git = simpleGit(repoPath);
        const status = await git.status();
        return !status.isClean();
    } catch {
        return false;
    }
}
