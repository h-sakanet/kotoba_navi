import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionDisplay } from './QuestionDisplay';
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

describe('QuestionDisplay', () => {
    it('同音異義語では「よみがな」と例文が表示される', () => {
        // 日本語コメント: 同音異義語の問題表示が適切か確認する
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
            <QuestionDisplay type="category" currentWord={word} text={word.question} />
        );

        expect(screen.getByText('イイン')).toBeInTheDocument();
        expect(screen.getByText('い＿にいく')).toBeInTheDocument();
        expect(screen.getByText('＿＿に行く')).toBeInTheDocument();
    });

    it('ことわざグループでは「答えは◯つあります」が表示される', () => {
        // 日本語コメント: 似た意味/対になることわざのカウント表示を確認する
        const word: Word = {
            ...baseWord,
            category: '似た意味のことわざ',
            yomigana: 'いみ',
            groupMembers: [
                { rawWord: 'A', yomigana: 'A' },
                { rawWord: 'B', yomigana: 'B' },
            ],
        };

        render(
            <QuestionDisplay type="category" currentWord={word} text={word.question} />
        );

        expect(screen.getByText('答えは 2 つあります')).toBeInTheDocument();
    });

    it('類義語テストでは左右に出題文が表示される', () => {
        // 日本語コメント: 類義語の出題文が左右レイアウトで表示されることを確認する
        const word: Word = {
            ...baseWord,
            category: '類義語',
            groupMembers: [
                {
                    rawWord: 'A',
                    yomigana: 'あ',
                    exampleSentence: '文A',
                    exampleSentenceYomigana: 'ぶんえー',
                },
                {
                    rawWord: 'B',
                    yomigana: 'びー',
                    exampleSentence: '文B',
                    exampleSentenceYomigana: 'ぶんびー',
                },
            ],
        };

        render(
            <QuestionDisplay type="category" currentWord={word} text={word.question} />
        );

        expect(screen.getByText('文A')).toBeInTheDocument();
        expect(screen.getByText('文B')).toBeInTheDocument();
        expect(screen.getByText('ぶんえー')).toBeInTheDocument();
        expect(screen.getByText('ぶんびー')).toBeInTheDocument();
    });

    it('意味テストでは語彙のよみがなが表示される', () => {
        // 日本語コメント: 意味テストの問題表示（語彙＋よみがな）を確認する
        const word: Word = {
            ...baseWord,
            category: 'ことわざ',
            yomigana: 'よみがな',
        };

        render(
            <QuestionDisplay type="meaning" currentWord={word} text={word.answer} />
        );

        expect(screen.getByText('よみがな')).toBeInTheDocument();
        expect(screen.getByText('ことわざA')).toBeInTheDocument();
    });
});
