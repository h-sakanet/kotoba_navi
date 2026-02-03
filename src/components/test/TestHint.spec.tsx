import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestHint } from './TestHint';
import { type Word } from '../../types';

const baseWord: Word = {
    id: 1,
    page: 1,
    numberInPage: 1,
    category: '類義語',
    question: '意味',
    answer: '語彙A',
    rawWord: '語彙A',
    rawMeaning: '意味',
    isLearnedCategory: false,
    isLearnedMeaning: false,
};

describe('TestHint', () => {
    it('meaningテストではヒントが表示されない', () => {
        // 日本語コメント: meaningテストは常に非表示になることを確認する
        const word: Word = {
            ...baseWord,
            groupMembers: [{ rawWord: 'A', yomigana: 'あ' }],
        };
        render(<TestHint type="meaning" currentWord={word} />);
        expect(screen.queryByText(/上：/)).not.toBeInTheDocument();
    });

    it('groupMembersが無い場合は表示されない', () => {
        // 日本語コメント: groupMembersが無ければ非表示になることを確認する
        render(<TestHint type="category" currentWord={baseWord} />);
        expect(screen.queryByText(/上：/)).not.toBeInTheDocument();
    });

    it('customLabelがある場合は上/下の個数が表示される', () => {
        // 日本語コメント: ラベル付きの場合は上/下の個数表示になることを確認する
        const word: Word = {
            ...baseWord,
            groupMembers: [
                { rawWord: 'A', yomigana: 'あ', customLabel: '上' },
                { rawWord: 'B', yomigana: 'び', customLabel: '上' },
                { rawWord: 'C', yomigana: 'し', customLabel: '下' },
            ],
        };
        render(<TestHint type="category" currentWord={word} />);
        expect(screen.getByText('上：2個 / 下：1個')).toBeInTheDocument();
    });

    it('customLabelが無い場合は「似た意味のことわざ：X個」になる', () => {
        // 日本語コメント: ラベル無しの場合は個数のみ表示されることを確認する
        const word: Word = {
            ...baseWord,
            groupMembers: [
                { rawWord: 'A', yomigana: 'あ' },
                { rawWord: 'B', yomigana: 'び' },
            ],
        };
        render(<TestHint type="category" currentWord={word} />);
        expect(screen.getByText('似た意味のことわざ：2個')).toBeInTheDocument();
    });
});
