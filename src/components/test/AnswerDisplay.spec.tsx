import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnswerDisplay } from './AnswerDisplay';
import { type Word } from '../../types';

const baseWord: Word = {
    id: 1,
    page: 1,
    numberInPage: 1,
    category: 'ことわざ',
    question: '意味',
    answer: 'ことわざA',
    rawWord: 'ことわざA',
    rawMeaning: '意味',
    isLearnedCategory: false,
    isLearnedMeaning: false,
};

describe('AnswerDisplay', () => {
    it('同音異義語では空欄に語彙が埋め込まれる', () => {
        // 日本語コメント: 解答表示で空欄が語彙に置き換わることを確認する
        const word: Word = {
            ...baseWord,
            category: '同音異義語',
            yomigana: 'イイン',
            groupMembers: [
                {
                    rawWord: '医院',
                    yomigana: 'イイン',
                    exampleSentence: '＿＿に行く',
                    exampleSentenceYomigana: 'い＿にいく',
                },
            ],
        };

        render(
            <AnswerDisplay type="category" currentWord={word} text={word.answer} />
        );

        expect(screen.getByText('イイン')).toBeInTheDocument();
        expect(screen.getByText('い＿にいく')).toBeInTheDocument();
        expect(screen.getByText('医院')).toBeInTheDocument();
    });

    it('ことわざグループでは語彙とふりがなが表示される', () => {
        // 日本語コメント: ことわざペアの解答表示（語彙＋ふりがな）を確認する
        const word: Word = {
            ...baseWord,
            category: '対になることわざ',
            yomigana: 'よみ',
            groupMembers: [
                {
                    rawWord: 'ことわざA',
                    yomigana: 'ことわざA',
                    exampleSentence: 'ふりがなA',
                },
            ],
        };

        render(
            <AnswerDisplay type="category" currentWord={word} text={word.answer} />
        );

        expect(screen.getByText('ふりがなA')).toBeInTheDocument();
        expect(screen.getByText('ことわざA')).toBeInTheDocument();
    });

    it('類義語の解答では左右に語彙が表示される', () => {
        // 日本語コメント: 類義語の解答表示が左右レイアウトになることを確認する
        const word: Word = {
            ...baseWord,
            category: '類義語',
            groupMembers: [
                { rawWord: 'A', yomigana: 'あ' },
                { rawWord: 'B', yomigana: 'びー' },
            ],
        };

        render(
            <AnswerDisplay type="category" currentWord={word} text={word.answer} />
        );

        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
        expect(screen.getByText('あ')).toBeInTheDocument();
        expect(screen.getByText('びー')).toBeInTheDocument();
    });

    it('意味テストではよみがなは表示されない', () => {
        // 日本語コメント: 意味テストの解答表示ではよみがなが出ないことを確認する
        const word: Word = {
            ...baseWord,
            category: 'ことわざ',
            yomigana: 'よみがな',
        };

        render(
            <AnswerDisplay type="meaning" currentWord={word} text={word.question} />
        );

        expect(screen.queryByText('よみがな')).not.toBeInTheDocument();
        expect(screen.getByText('意味')).toBeInTheDocument();
    });
});
