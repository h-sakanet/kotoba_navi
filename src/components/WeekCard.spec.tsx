import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeekCard } from './WeekCard';
import { type Scope } from '../types';

// --- モック定義 ---
const { getWords, setWords } = vi.hoisted(() => {
    let words: any[] = [];
    return {
        getWords: () => words,
        setWords: (next: any[]) => {
            words = next;
        },
    };
});

vi.mock('../db', () => ({
    db: {
        words: {
            where: () => ({
                between: () => ({
                    toArray: () => Promise.resolve([...getWords()]),
                }),
            }),
        },
    },
}));

describe('WeekCard', () => {
    beforeEach(() => {
        // 日本語コメント: テストごとにデータを初期化する
        setWords([]);
    });

    it('データがない場合は未登録表示でクリックできない', async () => {
        // 日本語コメント: 未登録カードが無効状態になることを確認する
        const scope: Scope = {
            id: 'TEST-01',
            startPage: 1,
            endPage: 1,
            category: 'ことわざ',
        };
        const onClick = vi.fn();

        render(<WeekCard scope={scope} onClick={onClick} />);

        expect(await screen.findByText('未登録')).toBeInTheDocument();
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('学習が100%の場合はスターが表示される', async () => {
        // 日本語コメント: 進捗100%でスター表示が出ることを確認する
        setWords([
            { isLearnedCategory: true, isLearnedMeaning: true },
        ]);
        const scope: Scope = {
            id: 'TEST-02',
            startPage: 1,
            endPage: 1,
            category: 'ことわざ',
        };

        render(<WeekCard scope={scope} onClick={vi.fn()} />);

        expect(await screen.findByText('100%')).toBeInTheDocument();
        expect(document.querySelector('svg.lucide-star')).toBeInTheDocument();
    });

    it('データがある場合はクリックで onClick が呼ばれる', async () => {
        // 日本語コメント: 有効カードはクリック可能であることを確認する
        setWords([
            { isLearnedCategory: false, isLearnedMeaning: false },
        ]);
        const scope: Scope = {
            id: 'TEST-03',
            startPage: 1,
            endPage: 1,
            category: 'ことわざ',
        };
        const onClick = vi.fn();
        const user = userEvent.setup();

        render(<WeekCard scope={scope} onClick={onClick} />);

        const button = await screen.findByRole('button');
        await user.click(button);
        expect(onClick).toHaveBeenCalledWith(scope);
    });
});
