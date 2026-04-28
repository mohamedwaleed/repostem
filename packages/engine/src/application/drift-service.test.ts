import { describe, it, expect } from 'vitest';
import { detectDrift } from './drift-service';

describe('DriftService - detectDrift', () => {
    it('should throw not implemented error', async () => {
        await expect(
            detectDrift('/tmp/test-repo')
        ).rejects.toThrow(/Not implemented/i);
    });
});
