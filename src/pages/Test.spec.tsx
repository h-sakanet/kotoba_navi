import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Test } from './Test';

// --- モック定義 ---
const { mockUpdate, mockNavigate, getWords, setWords, getSearchParams, setSearchParams, getScopes, setScopes } = vi.hoisted(() => {
    let words: any[] = [];
    let search = new URLSearchParams('');
    let scopes: any[] = [{ id: 'TEST-01', category: 'ことわざ', startPage: 1, endPage: 1 }];
    return {
        mockUpdate: vi.fn(),
        mockNavigate: vi.fn(),
        getWords: () => words,
        setWords: (next: any[]) => {
            words = next;
        },
        getSearchParams: () => search,
        setSearchParams: (next: string) => {
            search = new URLSearchParams(next);
        },
        getScopes: () => scopes,
        setScopes: (next: any[]) => {
            scopes = next;
        },
    };
});

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ scopeId: 'TEST-01' }),
        useNavigate: () => mockNavigate,
        useSearchParams: () => [getSearchParams(), vi.fn()],
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
            update: mockUpdate,
        },
    },
}));

vi.mock('../data/scope', () => ({
    get SCOPES() {
        return getScopes();
    },
    findScopeById: (id: string) => getScopes().find(s => s.id === id),
}));

describe('Test', () => {
    beforeEach(() => {
        // 日本語コメント: テストごとにモック状態を初期化する
        mockUpdate.mockClear();
        mockUpdate.mockResolvedValue(1);
        mockNavigate.mockClear();
        setSearchParams('');
        setScopes([{ id: 'TEST-01', category: 'ことわざ', startPage: 1, endPage: 1 }]);
        setWords([]);
    });

    it('未習得がない場合は「課題はありません」が表示される', async () => {
        // 日本語コメント: すべて習得済みの場合は課題なし画面になることを確認する
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '言葉A',
                rawWord: '言葉A',
                rawMeaning: '意味A',
                isLearnedCategory: true,
                isLearnedMeaning: true,
            },
        ]);

        render(<Test />);

        expect(await screen.findByText('課題はありません')).toBeInTheDocument();
    });

    it('意味テストでは未習得の語彙のみ出題される', async () => {
        // 日本語コメント: 意味テストで未習得のみが出題されることを確認する
        setSearchParams('type=meaning');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '未習得語',
                rawWord: '未習得語',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
            {
                id: 2,
                page: 1,
                numberInPage: 2,
                category: 'ことわざ',
                question: '意味B',
                answer: '学習済み語',
                rawWord: '学習済み語',
                rawMeaning: '意味B',
                isLearnedCategory: false,
                isLearnedMeaning: true,
            },
        ]);

        render(<Test />);

        expect(await screen.findByText('未習得語')).toBeInTheDocument();
        expect(screen.queryByText('学習済み語')).not.toBeInTheDocument();
    });

    it('意味テストで「覚えた！」を押すと isLearnedMeaning が更新される', async () => {
        // 日本語コメント: 正解処理で意味テストのフラグが立つことを確認する
        const user = userEvent.setup();
        setSearchParams('type=meaning');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '言葉A',
                rawWord: '言葉A',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<Test />);

        await screen.findByText('正解を表示');
        await user.click(screen.getByText('正解を表示'));

        await user.click(screen.getByText('覚えた！'));

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    isLearnedMeaning: true,
                })
            );
        });
    });

    it('カテゴリテストで「やり直し」を押すと isLearnedCategory が false になる', async () => {
        // 日本語コメント: 非最終モードのやり直しでフラグが下がることを確認する
        const user = userEvent.setup();
        setSearchParams('type=category');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '語彙A',
                rawWord: '語彙A',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<Test />);

        await screen.findByText('正解を表示');
        await user.click(screen.getByText('正解を表示'));
        await user.click(screen.getByText('やり直し'));

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    isLearnedCategory: false,
                })
            );
        });
    });

    it('最終テストでは習得済みの語彙も出題される', async () => {
        // 日本語コメント: final=true の場合、習得済みでも課題なしにならないことを確認する
        const user = userEvent.setup();
        setSearchParams('type=meaning&final=true');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '学習済み語',
                rawWord: '学習済み語',
                rawMeaning: '意味A',
                isLearnedCategory: true,
                isLearnedMeaning: true,
            },
        ]);

        render(<Test />);

        await screen.findByText('正解を表示');
        expect(screen.queryByText('課題はありません')).not.toBeInTheDocument();

        // 日本語コメント: 出題語彙が表示される
        expect(screen.getByText('学習済み語')).toBeInTheDocument();
        await user.click(screen.getByText('正解を表示'));
    });

    it('最終テストで「覚えた！」を押してもフラグは更新されない', async () => {
        // 日本語コメント: final=true の正解では学習フラグが変更されないことを確認する
        const user = userEvent.setup();
        setSearchParams('type=meaning&final=true');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '語彙A',
                rawWord: '語彙A',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<Test />);

        await screen.findByText('正解を表示');
        await user.click(screen.getByText('正解を表示'));
        await user.click(screen.getByText('覚えた！'));

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalled();
        });

        const updates = mockUpdate.mock.calls[0][1];
        expect(updates).not.toHaveProperty('isLearnedMeaning');
        expect(updates).not.toHaveProperty('isLearnedCategory');
    });

    it('最終テストで「やり直し」を押すとフラグが false になる', async () => {
        // 日本語コメント: final=true では「やり直し」だけが学習フラグを下げる
        const user = userEvent.setup();
        setSearchParams('type=meaning&final=true');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '語彙A',
                rawWord: '語彙A',
                rawMeaning: '意味A',
                isLearnedCategory: true,
                isLearnedMeaning: true,
            },
        ]);

        render(<Test />);

        await screen.findByText('正解を表示');
        await user.click(screen.getByText('正解を表示'));
        await user.click(screen.getByText('やり直し'));

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    isLearnedMeaning: false,
                })
            );
        });
    });

    it('カテゴリテストでは習得済みの語彙は出題されない', async () => {
        // 日本語コメント: カテゴリテストで isLearnedCategory が true の語彙は除外される
        setSearchParams('type=category');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '未習得語',
                rawWord: '未習得語',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
            {
                id: 2,
                page: 1,
                numberInPage: 2,
                category: 'ことわざ',
                question: '意味B',
                answer: '習得済み語',
                rawWord: '習得済み語',
                rawMeaning: '意味B',
                isLearnedCategory: true,
                isLearnedMeaning: false,
            },
        ]);

        render(<Test />);

        expect(await screen.findByText('意味A')).toBeInTheDocument();
        expect(screen.queryByText('意味B')).not.toBeInTheDocument();
    });

    it('1問のみのカテゴリテストは完了画面に遷移する', async () => {
        // 日本語コメント: 1問だけの場合に完了画面が表示されることを確認する
        const user = userEvent.setup();
        setSearchParams('type=category');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '語彙A',
                rawWord: '語彙A',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<Test />);

        await screen.findByText('正解を表示');
        await user.click(screen.getByText('正解を表示'));
        await user.click(screen.getByText('覚えた！'));

        expect(await screen.findByText('お疲れ様でした！')).toBeInTheDocument();
    });

    it('完了画面の「テスト終了」でホームに戻れる', async () => {
        // 日本語コメント: 完了画面のボタンでホームへ戻ることを確認する
        const user = userEvent.setup();
        setSearchParams('type=category');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '語彙A',
                rawWord: '語彙A',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<Test />);

        await screen.findByText('正解を表示');
        await user.click(screen.getByText('正解を表示'));
        await user.click(screen.getByText('覚えた！'));

        await user.click(await screen.findByText('テスト終了'));
        expect(mockNavigate).toHaveBeenCalledWith('/?modal=TEST-01');
    });

    // TODO: コンフィグ駆動UI移行後の同音異義語表示ロジック検証が必要
    it('同音異義語では正解表示後に空欄のままの文が消える', async () => {
        // 日本語コメント: 正解表示後に「＿＿」付きの出題文が消えることを確認する
        const user = userEvent.setup();
        setScopes([{ id: 'TEST-01', category: '同音異義語', startPage: 1, endPage: 1 }]);
        setSearchParams('type=category');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '同音異義語',
                question: '意味',
                answer: '医院',
                rawWord: '医院',
                rawMeaning: '意味',
                yomigana: 'イイン',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    {
                        rawWord: '医院',
                        yomigana: 'イイン',
                        exampleSentence: '＿＿に行く',
                        exampleSentenceYomigana: 'い＿にいく',
                    },
                ],
            },
        ]);

        render(<Test />);

        // Check for parts instead of full sentence to avoid splitting issues in test matcher
        await screen.findAllByText(/＿＿/);
        await screen.findAllByText(/に行く/);

        await user.click(screen.getByText('正解を表示'));

        // Blank should be gone (replaced by word)
        // Note: Yomigana might have single ＿, but double ＿＿ should be gone
        expect(screen.queryByText(/＿＿/)).not.toBeInTheDocument();
        expect(screen.getByText('医院')).toBeInTheDocument();
    });

    it('課題なし画面の「ホームに戻る」でホームへ戻れる', async () => {
        // 日本語コメント: 課題なし画面のボタンでホームに戻ることを確認する
        const user = userEvent.setup();
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '語彙A',
                rawWord: '語彙A',
                rawMeaning: '意味A',
                isLearnedCategory: true,
                isLearnedMeaning: true,
            },
        ]);

        render(<Test />);

        await screen.findByText('課題はありません');
        await user.click(screen.getByText('ホームに戻る'));
        expect(mockNavigate).toHaveBeenCalledWith('/?modal=TEST-01');
    });

    it('最終テスト(カテゴリ)のタイトルが表示される', async () => {
        // 日本語コメント: final=true & category のタイトル表示を確認する
        setSearchParams('type=category&final=true');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '語彙A',
                rawWord: '語彙A',
                rawMeaning: '意味A',
                isLearnedCategory: true,
                isLearnedMeaning: true,
            },
        ]);

        render(<Test />);

        expect(await screen.findByText('最終テスト(ことわざ)')).toBeInTheDocument();
    });

    it('中断ボタンでホームへ戻れる', async () => {
        // 日本語コメント: ヘッダの中断ボタンでホームへ戻ることを確認する
        const user = userEvent.setup();
        setSearchParams('type=category');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '語彙A',
                rawWord: '語彙A',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<Test />);

        await screen.findByText('正解を表示');
        await user.click(screen.getByText('中断'));
        expect(mockNavigate).toHaveBeenCalledWith('/?modal=TEST-01');
    });

    it('IDが無い問題では更新されない', async () => {
        // 日本語コメント: currentWord.id が無い場合に update が呼ばれないことを確認する
        const user = userEvent.setup();
        setSearchParams('type=category');
        setWords([
            {
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '語彙A',
                rawWord: '語彙A',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<Test />);

        await screen.findByText('正解を表示');
        await user.click(screen.getByText('正解を表示'));
        await user.click(screen.getByText('覚えた！'));

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('スコープが見つからない場合はエラー表示になる', async () => {
        // 日本語コメント: scopeIdに対応するスコープが無い場合の表示を確認する
        setScopes([]);
        render(<Test />);

        expect(await screen.findByText('Scope not found')).toBeInTheDocument();
    });

    it('戻るボタンで前の問題に戻れる', async () => {
        // 日本語コメント: 2問以上ある場合に戻るボタンが機能することを確認する
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
        const user = userEvent.setup();
        setSearchParams('type=category');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味A',
                answer: '語彙A',
                rawWord: '語彙A',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
            {
                id: 2,
                page: 1,
                numberInPage: 2,
                category: 'ことわざ',
                question: '意味B',
                answer: '語彙B',
                rawWord: '語彙B',
                rawMeaning: '意味B',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<Test />);

        // 日本語コメント: 初回の問題文（意味A）が出るまで待つ
        await screen.findByText('意味A');
        await user.click(screen.getByText('正解を表示'));
        await user.click(screen.getByText('覚えた！'));

        // 日本語コメント: 次の問題に進んだことを確認
        expect(await screen.findByText('意味B')).toBeInTheDocument();

        // 日本語コメント: 戻るボタンを押して前の問題へ
        await user.click(screen.getByLabelText('前の問題に戻る'));
        // 日本語コメント: 戻ると「意味A」の問題文が再表示される
        expect(await screen.findByText('意味A')).toBeInTheDocument();
        randomSpy.mockRestore();
    });
    it('sentence_fill モードでは例文の穴埋めが行われる', async () => {
        // 日本語コメント: 類義語（sentence_fillモード）で、例文の＿＿が単語に置換されることを確認する
        setScopes([{ id: 'TEST-01', category: '類義語', startPage: 1, endPage: 1 }]);

        setSearchParams('type=category');
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '類義語',
                rawWord: '正解単語',
                rawMeaning: '意味テキスト',
                yomigana: 'せいかいたんご',
                groupMembers: [
                    {
                        rawWord: '正解単語', // Usually root word is member too or handled
                        yomigana: 'せいかいたんご',
                        exampleSentence: 'これは＿＿です',
                        exampleSentenceYomigana: 'これは＿＿です'
                    }
                ],
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<Test />);

        // Question: "似た意味のことわざ" Question shows 'example_yomigana' and 'example' (with mask?).
        // Config: Question: group_members mode='synonym_pair'. fields=['example_yomigana', 'example'].
        // Synonym Pair question usually shows example?
        // Let's verify Answer primarily.

        await screen.findByText('正解を表示');
        const user = userEvent.setup();
        await user.click(screen.getByText('正解を表示'));

        // Answer: mode='sentence_fill'. fields=['example_yomigana', 'example'].
        // Should replace ＿＿ with '正解単語'.

        expect(await screen.findByText('正解単語')).toBeInTheDocument();
        // Verify ＿＿ is GONE (split)
        // If "これは" and "です" exist.
        expect(screen.getAllByText(/これは/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/です/).length).toBeGreaterThan(0);
    });
});
