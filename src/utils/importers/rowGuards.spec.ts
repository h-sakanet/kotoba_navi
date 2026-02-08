import { describe, expect, it } from 'vitest';
import {
    hasPageAndNumber,
    isLikelyReading,
    isLikelySentence,
    isLikelyWord,
    isPositionLabel
} from './rowGuards';

describe('rowGuards', () => {
    it('hasPageAndNumber checks numeric first two columns', () => {
        expect(hasPageAndNumber(['12', '3'])).toBe(true);
        expect(hasPageAndNumber(['x', '3'])).toBe(false);
        expect(hasPageAndNumber(['12', 'y'])).toBe(false);
    });

    it('isPositionLabel matches 上/下 only', () => {
        expect(isPositionLabel('上')).toBe(true);
        expect(isPositionLabel('下')).toBe(true);
        expect(isPositionLabel('中')).toBe(false);
    });

    it('isLikelyReading validates reading-like text', () => {
        expect(isLikelyReading('いぬもあるけば')).toBe(true);
        expect(isLikelyReading('')).toBe(false);
        expect(isLikelyReading('漢字テキスト')).toBe(false);
        expect(isLikelyReading('あ'.repeat(31))).toBe(false);
    });

    it('isLikelySentence handles placeholder, length and punctuation branches', () => {
        expect(isLikelySentence('')).toBe(false);
        expect(isLikelySentence('これは＿＿です')).toBe(true);
        expect(isLikelySentence('ながめのぶんしょうです')).toBe(true);
        expect(isLikelySentence('短い。')).toBe(true);
        expect(isLikelySentence('短文')).toBe(false);
    });

    it('isLikelyWord is inverse of sentence heuristic for non-empty text', () => {
        expect(isLikelyWord('熟語')).toBe(true);
        expect(isLikelyWord('これは文章です。')).toBe(false);
        expect(isLikelyWord('')).toBe(false);
    });
});
