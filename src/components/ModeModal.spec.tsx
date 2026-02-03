import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeModal } from './ModeModal';
import { type Scope } from '../types';

// --- モック定義 ---
const { mockNavigate, getWords, setWords } = vi.hoisted(() => {
    let words: any[] = [];
    return {
        mockNavigate: vi.fn(),
        getWords: () => words,
        setWords: (next: any[]) => {
            words = next;
        },
    };
});

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
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

describe('ModeModal', () => {
    beforeEach(() => {
        // 日本語コメント: テストごとにモックを初期化する
        mockNavigate.mockClear();
        setWords([]);
    });

    it('ことわざでは意味テストカードが表示され、進捗が反映される', async () => {
        // 日本語コメント: 意味テストありカテゴリの表示を確認する
        const scope: Scope = {
            id: 'TEST-01',
            startPage: 1,
            endPage: 1,
            category: 'ことわざ',
        };

        setWords([
            { isLearnedCategory: true, isLearnedMeaning: false },
            { isLearnedCategory: false, isLearnedMeaning: false },
        ]);

        render(<ModeModal scope={scope} onClose={vi.fn()} />);

        expect(await screen.findByText('意味テスト')).toBeInTheDocument();
        expect(screen.getByText('1/2 (50%)')).toBeInTheDocument();
        expect(screen.getByText('0/2 (0%)')).toBeInTheDocument();

        const finalButtons = screen.getAllByText('最終テスト');
        // 日本語コメント: 学習が完了していないので最終テストは無効
        finalButtons.forEach(button => expect(button).toBeDisabled());
    });

    it('類義語では意味テストカードが表示されない', async () => {
        // 日本語コメント: 意味テストが存在しないカテゴリの表示を確認する
        const scope: Scope = {
            id: 'TEST-02',
            startPage: 1,
            endPage: 1,
            category: '類義語',
        };

        setWords([
            { isLearnedCategory: false, isLearnedMeaning: false },
        ]);

        render(<ModeModal scope={scope} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.queryByText('意味テスト')).not.toBeInTheDocument();
        });
    });

    it('ボタン操作で正しい画面へ遷移する', async () => {
        // 日本語コメント: 見て覚える/最終テストの遷移を確認する
        const scope: Scope = {
            id: 'TEST-03',
            startPage: 1,
            endPage: 1,
            category: 'ことわざ',
        };

        setWords([
            { isLearnedCategory: true, isLearnedMeaning: true },
        ]);

        const user = userEvent.setup();
        render(<ModeModal scope={scope} onClose={vi.fn()} />);

        await screen.findByText('見て覚える');

        await user.click(screen.getByText('見て覚える'));
        expect(mockNavigate).toHaveBeenCalledWith('/view/TEST-03');

        // 日本語コメント: 「最終テスト」は2つあるので、先頭（カテゴリテスト側）を押す
        const finalButtons = screen.getAllByText('最終テスト');
        await user.click(finalButtons[0]);
        expect(mockNavigate).toHaveBeenCalledWith('/test/TEST-03?type=category&final=true');

        // 日本語コメント: 意味テスト側の最終テストも遷移する
        await user.click(finalButtons[1]);
        expect(mockNavigate).toHaveBeenCalledWith('/test/TEST-03?type=meaning&final=true');
    });

    it('閉じるボタンを押すと onClose が呼ばれる', async () => {
        // 日本語コメント: 右上の閉じるボタンが onClose を呼ぶことを確認する
        const scope: Scope = {
            id: 'TEST-04',
            startPage: 1,
            endPage: 1,
            category: 'ことわざ',
        };

        setWords([{ isLearnedCategory: false, isLearnedMeaning: false }]);

        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<ModeModal scope={scope} onClose={onClose} />);

        const closeIcon = await waitFor(() => document.querySelector('svg.lucide-x'));
        const closeButton = closeIcon?.closest('button');
        await user.click(closeButton as HTMLElement);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('カテゴリ/意味テストの通常ボタンで遷移する', async () => {
        // 日本語コメント: 未完了時のテストボタンで遷移することを確認する
        const scope: Scope = {
            id: 'TEST-05',
            startPage: 1,
            endPage: 1,
            category: 'ことわざ',
        };

        setWords([
            { isLearnedCategory: false, isLearnedMeaning: false },
            { isLearnedCategory: false, isLearnedMeaning: false },
        ]);

        const user = userEvent.setup();
        render(<ModeModal scope={scope} onClose={vi.fn()} />);

        const testButtons = await screen.findAllByText('テスト');
        await user.click(testButtons[0]);
        await user.click(testButtons[1]);

        expect(mockNavigate).toHaveBeenCalledWith('/test/TEST-05?type=category');
        expect(mockNavigate).toHaveBeenCalledWith('/test/TEST-05?type=meaning');
    });
});
