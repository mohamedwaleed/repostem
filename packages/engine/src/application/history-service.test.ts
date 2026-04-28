import { describe, it, expect } from 'vitest';
import { getSnapshotHistory, getFileHistory } from './history-service';

describe('HistoryService - getSnapshotHistory', () => {
    it('should throw not implemented error', async () => {
        await expect(
            getSnapshotHistory('/tmp/test-repo')
        ).rejects.toThrow(/Not implemented/i);
    });

    it('should throw not implemented error with limit parameter', async () => {
        await expect(
            getSnapshotHistory('/tmp/test-repo', 5)
        ).rejects.toThrow(/Not implemented/i);
    });
});

describe('HistoryService - getFileHistory', () => {
    it('should throw not implemented error', async () => {
        await expect(
            getFileHistory('/tmp/test-repo', 'src/index.ts')
        ).rejects.toThrow(/Not implemented/i);
    });

    it('should throw not implemented error with limit parameter', async () => {
        await expect(
            getFileHistory('/tmp/test-repo', 'src/index.ts', 10)
        ).rejects.toThrow(/Not implemented/i);
    });
});
