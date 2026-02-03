import { describe, it, expect } from 'vitest';
import { StandardImporter } from './StandardImporter';
import { PositionImporter } from './PositionImporter';
import { SynonymImporter } from './SynonymImporter';
import { PairedIdiomImporter } from './PairedIdiomImporter';
import { IdiomImporter } from './IdiomImporter';
import { HomonymImporter } from './HomonymImporter';
import { ProverbGroupImporter } from './ProverbGroupImporter';

describe('各ImporterのparseRow', () => {
    it('StandardImporterは標準形式を読み取れる', () => {
        // 日本語コメント: 標準5列の取り込みを確認する
        const importer = new StandardImporter();
        const result = importer.parseRow(['10', '1', '言葉', 'よみ', '意味']);
        expect(result).toEqual({
            page: 10,
            numberInPage: 1,
            rawWord: '言葉',
            yomigana: 'よみ',
            meaning: '意味',
        });
    });

    it('PositionImporterは上/下の位置を読み取れる', () => {
        // 日本語コメント: 位置ラベル(上/下)が customLabel として入ることを確認する
        const importer = new PositionImporter();
        const result = importer.parseRow(['10', '1', '上', '語彙', 'よみ', '意味']);
        expect(result).toEqual({
            page: 10,
            numberInPage: 1,
            rawWord: '語彙',
            yomigana: 'よみ',
            meaning: '意味',
            customLabel: '上',
        });
    });

    it('SynonymImporterは2件の行に分割できる', () => {
        // 日本語コメント: 類義語の左右2件が返ることを確認する
        const importer = new SynonymImporter();
        const result = importer.parseRow([
            '10', '1',
            '語A', 'あ', '文A', 'ぶんA',
            '語B', 'び', '文B', 'ぶんB',
        ]);
        expect(Array.isArray(result)).toBe(true);
        if (Array.isArray(result)) {
            expect(result).toHaveLength(2);
            expect(result[0].customLabel).toBe('上');
            expect(result[1].customLabel).toBe('下');
        }
    });

    it('PairedIdiomImporterは熟語と出題文を読み取れる', () => {
        // 日本語コメント: 上下で対となる熟語の形式を確認する
        const importer = new PairedIdiomImporter();
        const result = importer.parseRow(['101', '1', '上下', 'じょうげ', '文', 'ぶん']);
        expect(result).toEqual({
            page: 101,
            numberInPage: 1,
            rawWord: '上下',
            yomigana: 'じょうげ',
            meaning: '文',
            question: '文',
            exampleSentence: '文',
            exampleSentenceYomigana: 'ぶん',
        });
    });

    it('IdiomImporterは慣用句形式を読み取れる', () => {
        // 日本語コメント: 慣用句の6列形式を確認する
        const importer = new IdiomImporter();
        const result = importer.parseRow(['50', '1', '出題文', '語彙', 'よみ', '意味']);
        expect(result).toEqual({
            page: 50,
            numberInPage: 1,
            rawWord: '語彙',
            yomigana: 'よみ',
            meaning: '意味',
            exampleSentence: '出題文',
        });
    });

    it('HomonymImporterは同音異義語形式を読み取れる', () => {
        // 日本語コメント: 同音異義語の形式で例文・よみがなが入ることを確認する
        const importer = new HomonymImporter();
        const result = importer.parseRow(['144', '1', 'イイン', '医院', '＿＿に行く', 'い＿にいく']);
        expect(result).toEqual({
            page: 144,
            numberInPage: 1,
            rawWord: '医院',
            yomigana: 'イイン',
            meaning: '＿＿に行く',
            exampleSentence: '＿＿に行く',
            exampleSentenceYomigana: 'い＿にいく',
        });
    });

    it('ProverbGroupImporterはことわざグループ形式を読み取れる', () => {
        // 日本語コメント: 似た意味/対になることわざの形式を確認する
        const importer = new ProverbGroupImporter();
        const result = importer.parseRow(['34', '1', 'ことわざ', 'よみ', '意味']);
        expect(result).toEqual({
            page: 34,
            numberInPage: 1,
            rawWord: 'ことわざ',
            yomigana: '意味',
            meaning: '意味',
            exampleSentence: 'よみ',
            customLabel: undefined,
        });
    });
});

describe('各ImporterのcanHandle', () => {
    it('PairedIdiomImporterは「語彙が短く文が長い」場合のみtrueになる', () => {
        // 日本語コメント: 上下で対となる熟語の判定条件を確認する
        const importer = new PairedIdiomImporter();
        const ok = importer.canHandle(['101', '1', '上下', 'じょうげ', '長い出題文', 'ぶん']);
        const ng = importer.canHandle(['101', '1', 'これは長い文', 'じょうげ', '短', 'ぶん']);
        expect(ok).toBe(true);
        expect(ng).toBe(false);
    });

    it('HomonymImporterは「よみがなが短い」場合にtrueになる', () => {
        // 日本語コメント: 同音異義語の判定条件を確認する
        const importer = new HomonymImporter();
        const ok = importer.canHandle(['144', '1', 'イイン', '医院', '＿＿に行く', 'い＿にいく']);
        const ng = importer.canHandle(['144', '1', 'これは長い文章です', '医院', '＿＿に行く', 'い＿にいく']);
        expect(ok).toBe(true);
        expect(ng).toBe(false);
    });
});
