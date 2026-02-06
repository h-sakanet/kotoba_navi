import { describe, expect, it } from 'vitest';
import { HomonymImporter } from './HomonymImporter';
import { IdiomImporter } from './IdiomImporter';
import { PairedIdiomImporter } from './PairedIdiomImporter';
import { PairedProverbImporter } from './PairedProverbImporter';
import { SimilarProverbImporter } from './SimilarProverbImporter';
import { StandardImporter } from './StandardImporter';

describe('Importer canHandle heuristics', () => {
    const idiomRow = ['50', '1', 'お世話になった先生には頭が＿＿。', '頭が痛い', 'あたまがいたい', '苦しい状態。'];
    const homonymRow = ['144', '1', 'イイン', '医院', '学級＿＿になるように推薦された', 'がっきゅう___になるようにすいせんされた'];
    const pairedIdiomRow = ['101', '1', '厚遇', 'こうぐう', '外国から届いた手紙に＿＿を書く。', 'がいこくからとどいたてがみに___をかく。'];
    const standardRow = ['12', '1', '犬も歩けば棒に当たる', 'いぬもあるけばぼうにあたる', '思いがけない幸運に出会うこと。'];
    const pairedProverbRow = ['37', '1', '上', '石の上にも三年', 'いしのうえにもさんねん', '辛抱すれば成果が出る。'];

    it('IdiomImporter should match idiom rows and reject homonym/paired-idiom rows', () => {
        const importer = new IdiomImporter();
        expect(importer.canHandle(idiomRow)).toBe(true);
        expect(importer.canHandle(homonymRow)).toBe(false);
        expect(importer.canHandle(pairedIdiomRow)).toBe(false);
    });

    it('HomonymImporter should match homonym rows and reject idiom rows', () => {
        const importer = new HomonymImporter();
        expect(importer.canHandle(homonymRow)).toBe(true);
        expect(importer.canHandle(idiomRow)).toBe(false);
    });

    it('PairedIdiomImporter should match paired-idiom rows and reject homonym/idiom rows', () => {
        const importer = new PairedIdiomImporter();
        expect(importer.canHandle(pairedIdiomRow)).toBe(true);
        expect(importer.canHandle(homonymRow)).toBe(false);
        expect(importer.canHandle(idiomRow)).toBe(false);
    });

    it('StandardImporter should only match 5-column standard rows', () => {
        const importer = new StandardImporter();
        expect(importer.canHandle(standardRow)).toBe(true);
        expect(importer.canHandle(idiomRow)).toBe(false);
    });

    it('SimilarProverbImporter should only match 5-column rows', () => {
        const importer = new SimilarProverbImporter();
        expect(importer.canHandle(standardRow)).toBe(true);
        expect(importer.canHandle(idiomRow)).toBe(false);
    });

    it('PairedProverbImporter should require position marker', () => {
        const importer = new PairedProverbImporter();
        expect(importer.canHandle(pairedProverbRow)).toBe(true);
        expect(importer.canHandle(standardRow)).toBe(false);
    });
});
