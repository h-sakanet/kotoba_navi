import { describe, it, expect } from 'vitest';
import {
    canEditExampleSentence,
    hasMeaningTest,
    isHomonymCategory,
    isIdiomCategory,
    isProverbGroupCategory,
    isSingleTestCategory,
    isSynonymCategory
} from './categoryMeta';

describe('categoryMeta utilities', () => {
    it('同音異義語/同訓異字/ことわざペアは「同音異義語系」と判定される', () => {
        // 日本語コメント: 同音異義語系のカテゴリは true になることを確認する
        expect(isHomonymCategory('同音異義語')).toBe(true);
        expect(isHomonymCategory('同訓異字')).toBe(true);
        expect(isHomonymCategory('似た意味のことわざ')).toBe(true);
        expect(isHomonymCategory('対になることわざ')).toBe(true);
        // 日本語コメント: 代表的な通常カテゴリは false になることを確認する
        expect(isHomonymCategory('ことわざ')).toBe(false);
    });

    it('ことわざペアは「グループことわざ」と判定される', () => {
        // 日本語コメント: 似た意味/対になる ことわざのみ true
        expect(isProverbGroupCategory('似た意味のことわざ')).toBe(true);
        expect(isProverbGroupCategory('対になることわざ')).toBe(true);
        expect(isProverbGroupCategory('ことわざ')).toBe(false);
    });

    it('類義語/対義語は「類義語系」と判定される', () => {
        // 日本語コメント: 類義語・対義語は true
        expect(isSynonymCategory('類義語')).toBe(true);
        expect(isSynonymCategory('対義語')).toBe(true);
        // 日本語コメント: 他のカテゴリは false
        expect(isSynonymCategory('慣用句')).toBe(false);
    });

    it('慣用句/四字熟語/三字熟語は「慣用句系」と判定される', () => {
        // 日本語コメント: 慣用句系は true
        expect(isIdiomCategory('慣用句')).toBe(true);
        expect(isIdiomCategory('四字熟語')).toBe(true);
        expect(isIdiomCategory('三字熟語')).toBe(true);
        // 日本語コメント: ことわざは false
        expect(isIdiomCategory('ことわざ')).toBe(false);
    });

    it('意味テストの有無が正しく判定される', () => {
        // 日本語コメント: 単一テストカテゴリは meaning テストが無い
        expect(hasMeaningTest('類義語')).toBe(false);
        expect(hasMeaningTest('対義語')).toBe(false);
        expect(hasMeaningTest('上下で対となる熟語')).toBe(false);
        expect(hasMeaningTest('同音異義語')).toBe(false);
        expect(hasMeaningTest('同訓異字')).toBe(false);
        expect(hasMeaningTest('似た意味のことわざ')).toBe(false);
        expect(hasMeaningTest('対になることわざ')).toBe(false);
        // 日本語コメント: 通常カテゴリは meaning テストあり
        expect(hasMeaningTest('ことわざ')).toBe(true);
        expect(hasMeaningTest('慣用句')).toBe(true);
        expect(hasMeaningTest('四字熟語')).toBe(true);
        expect(hasMeaningTest('三字熟語')).toBe(true);
    });

    it('単一テストカテゴリの判定が正しい', () => {
        // 日本語コメント: 単一テストカテゴリは true
        expect(isSingleTestCategory('類義語')).toBe(true);
        expect(isSingleTestCategory('対義語')).toBe(true);
        expect(isSingleTestCategory('上下で対となる熟語')).toBe(true);
        // 日本語コメント: ことわざ/慣用句は false
        expect(isSingleTestCategory('ことわざ')).toBe(false);
        expect(isSingleTestCategory('慣用句')).toBe(false);
    });

    it('例文編集の可否が正しく判定される', () => {
        // 日本語コメント: 例文編集に対応しているカテゴリは true
        expect(canEditExampleSentence('類義語')).toBe(true);
        expect(canEditExampleSentence('対義語')).toBe(true);
        expect(canEditExampleSentence('慣用句')).toBe(true);
        expect(canEditExampleSentence('四字熟語')).toBe(true);
        expect(canEditExampleSentence('三字熟語')).toBe(true);
        // 日本語コメント: ことわざは false
        expect(canEditExampleSentence('ことわざ')).toBe(false);
    });
});
