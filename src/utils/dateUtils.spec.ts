import { describe, expect, it } from 'vitest';
import { formatDate } from './dateUtils';

describe('dateUtils', () => {
    it('formatDate returns M/D(曜) format', () => {
        expect(formatDate('2026-02-17')).toBe('2/17(火)');
    });

    it('formatDate returns null when input is empty', () => {
        expect(formatDate(undefined)).toBeNull();
    });
});
