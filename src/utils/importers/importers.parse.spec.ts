import { describe, expect, it } from 'vitest';
import { HomonymImporter } from './HomonymImporter';
import { IdiomImporter } from './IdiomImporter';
import { PairedIdiomImporter } from './PairedIdiomImporter';
import { PairedProverbImporter } from './PairedProverbImporter';
import { PositionImporter } from './PositionImporter';
import { ProverbGroupImporter } from './ProverbGroupImporter';
import { SimilarProverbImporter } from './SimilarProverbImporter';
import { StandardImporter } from './StandardImporter';
import { SynonymImporter } from './SynonymImporter';
import { getFallbackImporters, getImporterForCategory, getRegisteredImporterKinds } from './importerRegistry';

describe('Importer parse/mapping', () => {
    it('StandardImporter parses 5-column row and returns mapping', () => {
        const importer = new StandardImporter();
        const row = ['12', '1', '犬も歩けば棒に当たる', 'いぬもあるけばぼうにあたる', '思いがけない幸運に出会うこと。'];

        const parsed = importer.parseRow(row);
        expect(parsed).toEqual({
            page: 12,
            numberInPage: 1,
            rawWord: '犬も歩けば棒に当たる',
            yomigana: 'いぬもあるけばぼうにあたる',
            meaning: '思いがけない幸運に出会うこと。'
        });
        expect(importer.getColumnMapping()[2]).toBe('rawWord');
    });

    it('IdiomImporter parse/canHandle handles normal row and rejects position marker row', () => {
        const importer = new IdiomImporter();
        const ok = ['50', '1', 'お世話になった先生には頭が＿＿。', '頭が痛い', 'あたまがいたい', '苦しい状態。'];
        const ng = ['37', '1', '上', '石の上にも三年', 'いしのうえにもさんねん', '辛抱すれば成果が出る。'];

        expect(importer.canHandle(ok)).toBe(true);
        expect(importer.canHandle(ng)).toBe(false);
        expect(importer.parseRow(ok)).toEqual({
            page: 50,
            numberInPage: 1,
            rawWord: '頭が痛い',
            yomigana: 'あたまがいたい',
            meaning: '苦しい状態。',
            exampleSentence: 'お世話になった先生には頭が＿＿。'
        });
        expect(importer.getColumnMapping()[2]).toBe('exampleSentence');
    });

    it('HomonymImporter parse/canHandle validates reading and sentence fields', () => {
        const importer = new HomonymImporter();
        const ok = ['144', '1', 'いいん', '医院', '学級＿＿になるように推薦された', 'がっきゅう___になるようにすいせんされた'];
        const ng = ['144', '1', 'ABC', '医院', '学級＿＿になるように推薦された', 'がっきゅう___になるようにすいせんされた'];

        expect(importer.canHandle(ok)).toBe(true);
        expect(importer.canHandle(ng)).toBe(false);
        expect(importer.parseRow(ok)).toEqual({
            page: 144,
            numberInPage: 1,
            rawWord: '医院',
            yomigana: 'いいん',
            meaning: '',
            exampleSentence: '学級＿＿になるように推薦された',
            exampleSentenceYomigana: 'がっきゅう___になるようにすいせんされた'
        });
        expect(importer.getColumnMapping()[5]).toBe('exampleSentenceYomigana');
    });

    it('PairedIdiomImporter parses sentence format row', () => {
        const importer = new PairedIdiomImporter();
        const ok = ['101', '1', '厚遇', 'こうぐう', '外国から届いた手紙に＿＿を書く。', 'がいこくからとどいたてがみに___をかく。'];
        const ng = ['101', '1', '上', 'こうぐう', '外国から届いた手紙に＿＿を書く。', 'がいこくからとどいたてがみに___をかく。'];

        expect(importer.canHandle(ok)).toBe(true);
        expect(importer.canHandle(ng)).toBe(false);
        expect(importer.parseRow(ok)).toEqual({
            page: 101,
            numberInPage: 1,
            rawWord: '厚遇',
            yomigana: 'こうぐう',
            meaning: '',
            exampleSentence: '外国から届いた手紙に＿＿を書く。',
            exampleSentenceYomigana: 'がいこくからとどいたてがみに___をかく。'
        });
        expect(importer.getColumnMapping()[4]).toBe('exampleSentence');
    });

    it('SynonymImporter returns two parsed rows (上/下)', () => {
        const importer = new SynonymImporter();
        const row = ['88', '1', '不足', 'ふそく', '水分が＿＿している。', 'すいぶんが___している。', '欠乏', 'けつぼう', '資源が＿＿している。', 'しげんが___している。'];

        expect(importer.canHandle(row)).toBe(true);
        const parsed = importer.parseRow(row);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toHaveLength(2);
        expect(parsed?.[0].customLabel).toBe('上');
        expect(parsed?.[1].customLabel).toBe('下');
        expect(importer.getColumnMapping()[9]).toBe('itemB_sentenceYomi');
    });

    it('Position/PairedProverb/SimilarProverb/ProverbGroup parse rows with expected shape', () => {
        const positionImporter = new PositionImporter();
        const pairedImporter = new PairedProverbImporter();
        const similarImporter = new SimilarProverbImporter();
        const groupImporter = new ProverbGroupImporter();

        const pairedRow = ['37', '1', '上', '石の上にも三年', 'いしのうえにもさんねん', '辛抱すれば成果が出る。'];
        const similarRow = ['34', '1', 'ぬれ手であわ', 'ぬれてであわ', '苦労せず利益を得る。'];

        expect(positionImporter.canHandle(pairedRow)).toBe(true);
        expect(positionImporter.parseRow(pairedRow)?.customLabel).toBe('上');

        expect(pairedImporter.canHandle(pairedRow)).toBe(true);
        expect(pairedImporter.parseRow(pairedRow)?.customLabel).toBe('上');

        expect(similarImporter.canHandle(similarRow)).toBe(true);
        expect(similarImporter.parseRow(similarRow)?.rawWord).toBe('ぬれ手であわ');

        expect(groupImporter.canHandle(similarRow)).toBe(true);
        expect(groupImporter.parseRow(similarRow)?.customLabel).toBeUndefined();
        expect(groupImporter.parseRow(pairedRow)?.customLabel).toBe('上');
    });

    it('importerRegistry returns configured importers and fallback order starts with PositionImporter', () => {
        expect(getImporterForCategory('ことわざ')).toBeInstanceOf(StandardImporter);
        expect(getImporterForCategory('同音異義語')).toBeInstanceOf(HomonymImporter);
        expect(getImporterForCategory('類義語')).toBeInstanceOf(SynonymImporter);

        const fallback = getFallbackImporters();
        expect(fallback.length).toBeGreaterThan(0);
        expect(fallback[0]).toBeInstanceOf(PositionImporter);

        const kinds = getRegisteredImporterKinds();
        expect(kinds).toContain('standard');
        expect(kinds).toContain('paired_idiom');
    });
});
