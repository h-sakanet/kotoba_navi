import { describe, expect, it } from 'vitest';
import { CATEGORY_SETTINGS } from './categoryConfig';
import {
    buildDateWindow,
    buildLearningUnits,
    getDashboardSideVisibility,
    resolveTestSideByTestId
} from './learningDashboard';
import { type Word } from '../types';

describe('learningDashboard utils', () => {
    it('標準カテゴリは word 単位キーでユニットを作る', () => {
        const words: Word[] = [
            {
                id: 10,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味',
                answer: 'ことわざ',
                rawWord: 'ぬれ手であわ',
                yomigana: 'ぬれてであわ',
                rawMeaning: '苦労せず利益を得る',
                isLearnedCategory: false,
                isLearnedMeaning: false
            }
        ];

        const units = buildLearningUnits(words, CATEGORY_SETTINGS['ことわざ']);
        expect(units).toHaveLength(1);
        expect(units[0]).toEqual({
            id: 'word:10',
            title: 'ぬれ手であわ',
            leftUnitKey: 'word:10',
            rightUnitKey: 'word:10'
        });
    });

    it('類義語は左右ペアタイトルと左右別メンバーキーを使う', () => {
        const words: Word[] = [
            {
                id: 20,
                page: 1,
                numberInPage: 1,
                category: '類義語',
                question: '',
                answer: '',
                rawWord: '不足',
                rawMeaning: '',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '不足', yomigana: 'ふそく' },
                    { rawWord: '欠乏', yomigana: 'けつぼう' }
                ]
            }
        ];

        const units = buildLearningUnits(words, CATEGORY_SETTINGS['類義語']);
        expect(units).toHaveLength(1);
        expect(units[0]).toEqual({
            id: 'pair:20',
            title: '不足 / 欠乏',
            leftUnitKey: 'member:20:0',
            rightUnitKey: 'member:20:1'
        });
    });

    it('右タイトル系のグループカテゴリはメンバー単位ユニットになる', () => {
        const words: Word[] = [
            {
                id: 30,
                page: 1,
                numberInPage: 1,
                category: '同音異義語',
                question: '',
                answer: '',
                rawWord: '医院',
                rawMeaning: '',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '医院', yomigana: 'いいん' },
                    { rawWord: '委員', yomigana: 'いいん' }
                ]
            }
        ];

        const units = buildLearningUnits(words, CATEGORY_SETTINGS['同音異義語']);
        expect(units).toHaveLength(2);
        expect(units[0].id).toBe('member:30:0');
        expect(units[1].id).toBe('member:30:1');
    });

    it('表示サイド判定はマスク/テスト設定に追従する', () => {
        expect(getDashboardSideVisibility(CATEGORY_SETTINGS['ことわざ'])).toEqual({
            showLeft: true,
            showRight: true
        });
        expect(getDashboardSideVisibility(CATEGORY_SETTINGS['同音異義語'])).toEqual({
            showLeft: false,
            showRight: true
        });
    });

    it('buildLearningUnits は id がない語を除外し、title のフォールバックを使う', () => {
        const words: Word[] = [
            {
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '設問タイトル',
                answer: '',
                rawWord: '',
                rawMeaning: '',
                isLearnedCategory: false,
                isLearnedMeaning: false
            },
            {
                id: 99,
                page: 1,
                numberInPage: 2,
                category: 'ことわざ',
                question: '設問タイトル',
                answer: '',
                rawWord: '',
                rawMeaning: '',
                isLearnedCategory: false,
                isLearnedMeaning: false
            }
        ];

        const units = buildLearningUnits(words, CATEGORY_SETTINGS['ことわざ']);
        expect(units).toHaveLength(1);
        expect(units[0].title).toBe('設問タイトル');
    });

    it('left_right_pair で2件未満のメンバーは単体キーへフォールバックする', () => {
        const words: Word[] = [
            {
                id: 31,
                page: 1,
                numberInPage: 1,
                category: '類義語',
                question: '',
                answer: '',
                rawWord: '不足',
                rawMeaning: '',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [{ rawWord: '不足', yomigana: 'ふそく' }]
            }
        ];

        const units = buildLearningUnits(words, CATEGORY_SETTINGS['類義語']);
        expect(units).toHaveLength(1);
        expect(units[0]).toEqual({
            id: 'word:31',
            title: '不足',
            leftUnitKey: 'word:31',
            rightUnitKey: 'word:31'
        });
    });

    it('resolveTestSideByTestId は未知IDで null を返し、known IDでsideを返す', () => {
        expect(resolveTestSideByTestId(CATEGORY_SETTINGS['ことわざ'], 'category')).toBe('left');
        expect(resolveTestSideByTestId(CATEGORY_SETTINGS['ことわざ'], 'meaning')).toBe('right');
        expect(resolveTestSideByTestId(CATEGORY_SETTINGS['ことわざ'], 'unknown')).toBeNull();
    });

    it('buildDateWindow は日数指定に応じた開始日とラベル件数を返す', () => {
        const result = buildDateWindow('2026-02-17', 3);
        expect(result.startDate).toBe('2026-02-15');
        expect(result.endDate).toBe('2026-02-17');
        expect(result.dateKeys).toEqual(['2026-02-15', '2026-02-16', '2026-02-17']);
        expect(result.labels).toEqual(['2/15', '2/16', '2/17']);
    });
});
