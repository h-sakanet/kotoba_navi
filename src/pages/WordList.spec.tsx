import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'react-router-dom';
import { WordList } from './WordList';

// --- モック定義 ---
const { mockUpdate, mockNavigate, getWords, setWords, getScopes, setScopes } = vi.hoisted(() => {
    let words: any[] = []; // Keep internal mock storage flexible or type it if imported (vi.hoisted limitations)
    // vi.hoisted runs before imports, so we can't use imported types inside directly unless we duplicate or use 'any' safely.
    // However, the lint rule complains.
    // We can disable lint for mocks or try to define simple types inline.
    let scopes: { id: string; category: string; startPage: number; endPage: number }[] = [{ id: 'TEST-01', category: 'ことわざ', startPage: 1, endPage: 1 }];
    return {
        mockUpdate: vi.fn(),
        mockNavigate: vi.fn(),
        getWords: () => words,
        setWords: (next: any[]) => {
            words = next;
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
        useParams: vi.fn().mockReturnValue({ scopeId: 'TEST-01' }),
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../db', () => ({
    db: {
        words: {
            where: () => ({
                between: () => ({
                    sortBy: () => Promise.resolve([...getWords()]),
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

describe('WordList', () => {
    beforeEach(() => {
        // 日本語コメント: テストごとにモック状態を初期化する
        mockUpdate.mockClear();
        mockUpdate.mockResolvedValue(1);
        mockNavigate.mockClear();
        (useParams as any).mockReturnValue({ scopeId: 'TEST-01' });
        setScopes([{ id: 'TEST-01', category: 'ことわざ', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                rawWord: 'MasteredWord',
                rawMeaning: 'Mean1',
                isLearnedCategory: true,
                isLearnedMeaning: true,
            },
            {
                id: 2,
                page: 1,
                numberInPage: 2,
                category: 'ことわざ',
                rawWord: 'LearningWord',
                rawMeaning: 'Mean2',
                isLearnedCategory: true,
                isLearnedMeaning: false,
            },
        ]);
    });

    it('初期表示で単語一覧が表示される', async () => {
        // 日本語コメント: 画面を描画して、データが表示されることを確認する
        render(<WordList />);

        expect(await screen.findByText('MasteredWord')).toBeInTheDocument();
        expect(screen.getByText('LearningWord')).toBeInTheDocument();
    });

    it('scope が存在しない場合はエラー表示になる', async () => {
        // 日本語コメント: scope が見つからない場合の分岐を確認する
        setScopes([]);

        render(<WordList />);

        expect(await screen.findByText('Scope not found')).toBeInTheDocument();
    });

    it('ページ番号が異なるデータはページ順に並ぶ', async () => {
        // 日本語コメント: ページ番号の差分でソートされる分岐を確認する
        setScopes([{ id: 'TEST-01', category: 'ことわざ', startPage: 1, endPage: 2 }]);
        setWords([
            {
                id: 1,
                page: 2,
                numberInPage: 1,
                category: 'ことわざ',
                rawWord: 'Page2Word',
                rawMeaning: '意味2',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
            {
                id: 2,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                rawWord: 'Page1Word',
                rawMeaning: '意味1',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<WordList />);

        const orderedWords = await screen.findAllByText(/Page[12]Word/);
        expect(orderedWords[0]).toHaveTextContent('Page1Word');
        expect(orderedWords[1]).toHaveTextContent('Page2Word');
    });

    it('「習得済みを非表示」をONにすると完全習得の単語が消える', async () => {
        // 日本語コメント: トグルをONにして、完全習得の単語が消えることを確認する
        const user = userEvent.setup();
        render(<WordList />);

        await screen.findByText('MasteredWord');

        const toggle = screen.getByLabelText('習得済みを非表示');
        await user.click(toggle);

        await waitFor(() => {
            expect(screen.queryByText('MasteredWord')).not.toBeInTheDocument();
        });
        expect(screen.getByText('LearningWord')).toBeInTheDocument();
    });

    it('編集モードで意味テスト習得をONにして保存すると更新が呼ばれる', async () => {
        // 日本語コメント: 編集→チェック→保存で update が呼ばれることを確認する
        const user = userEvent.setup();
        render(<WordList />);

        const learningWord = await screen.findByText('LearningWord');
        const learningRow = learningWord.closest('tr');
        expect(learningRow).not.toBeNull();

        // 日本語コメント: 編集アイコン（ペン）をクリックして編集モードへ
        const editIcon = (learningRow as HTMLElement).querySelector('svg.lucide-pen');
        const editButton = editIcon?.closest('button');
        await user.click(editButton as HTMLElement);

        // 日本語コメント: 編集モードに入ったことを確認する（保存アイコンが出る）
        await waitFor(() => {
            expect((learningRow as HTMLElement).querySelector('svg.lucide-save')).toBeInTheDocument();
        });

        // 日本語コメント: 「意味テスト習得」のドットをクリック
        const meaningDot = within(learningRow as HTMLElement).getByTitle('意味テスト習得');
        await user.click(meaningDot);

        // 日本語コメント: 意味テキストを編集する
        const meaningArea = within(learningRow as HTMLElement).getByDisplayValue('Mean2');
        await user.clear(meaningArea as HTMLTextAreaElement);
        await user.type(meaningArea as HTMLTextAreaElement, 'Mean2-NEW');

        // 日本語コメント: 保存アイコン（保存）をクリック
        const saveIcon = await waitFor(() =>
            (learningRow as HTMLElement).querySelector('svg.lucide-save')
        );
        const saveButton = saveIcon?.closest('button');
        await user.click(saveButton as HTMLElement);

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                2,
                expect.objectContaining({
                    isLearnedCategory: true,
                    isLearnedMeaning: true,
                    rawMeaning: 'Mean2-NEW',
                })
            );
        });
    });

    it('編集モードで習得ドットを切り替えると保存結果に反映される', async () => {
        // 日本語コメント: 習得ドットのクリックで状態が更新されることを確認する
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                rawWord: '未習得語',
                rawMeaning: '意味',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        const user = userEvent.setup();
        render(<WordList />);

        const row = await screen.findByText('未習得語');
        const targetRow = row.closest('tr');
        expect(targetRow).not.toBeNull();

        const editIcon = (targetRow as HTMLElement).querySelector('svg.lucide-pen');
        const editButton = editIcon?.closest('button');
        await user.click(editButton as HTMLElement);

        // 日本語コメント: 編集モードに切り替わったことを確認する
        await waitFor(() => {
            expect((targetRow as HTMLElement).querySelector('svg.lucide-save')).toBeInTheDocument();
        });

        // 日本語コメント: 習得済みドットと意味テスト習得の両方をクリックする
        const categoryDot = within(targetRow as HTMLElement).getByTitle('習得済み');
        const meaningDot = within(targetRow as HTMLElement).getByTitle('意味テスト習得');
        await user.click(categoryDot);
        await user.click(meaningDot);

        const saveIcon = (targetRow as HTMLElement).querySelector('svg.lucide-save');
        const saveButton = saveIcon?.closest('button');
        await user.click(saveButton as HTMLElement);

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    isLearnedCategory: true,
                    isLearnedMeaning: true,
                })
            );
        });
    });

    it('編集前に習得ドットをクリックしても状態は変わらない', async () => {
        // 日本語コメント: 編集前にクリックした場合の分岐を確認する
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                rawWord: '未編集語',
                rawMeaning: '意味',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<WordList />);

        const categoryDot = await screen.findByTitle('習得済み');
        const meaningDot = screen.getByTitle('意味テスト習得');

        // 日本語コメント: disabled を外してクリックイベントを発火させる
        (categoryDot as HTMLButtonElement).disabled = false;
        (meaningDot as HTMLButtonElement).disabled = false;

        fireEvent.click(categoryDot);
        fireEvent.click(meaningDot);

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('同音異義語のグループ編集を保存すると groupMembers と rawWord が更新される', async () => {
        // 日本語コメント: 同音異義語の複数候補を編集して保存できることを確認する
        setScopes([{ id: 'TEST-01', category: '同音異義語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '同音異義語',
                question: '意味',
                answer: '医院',
                rawWord: '医院',
                yomigana: 'イイン',
                rawMeaning: '意味',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    {
                        rawWord: '医院',
                        yomigana: 'イイン',
                        exampleSentence: '＿＿に行く',
                        exampleSentenceYomigana: 'い＿にいく',
                    },
                    {
                        rawWord: '委員',
                        yomigana: 'イイン',
                        exampleSentence: '＿＿になる',
                        exampleSentenceYomigana: 'い＿になる',
                    },
                ],
            },
        ]);

        const user = userEvent.setup();
        render(<WordList />);

        const row = await screen.findByText('医院');
        const targetRow = row.closest('tr');
        expect(targetRow).not.toBeNull();

        // 日本語コメント: 編集アイコン（ペン）を押して編集モードにする
        const editIcon = (targetRow as HTMLElement).querySelector('svg.lucide-pen');
        const editButton = editIcon?.closest('button');
        await user.click(editButton as HTMLElement);

        // 日本語コメント: 編集モードに入ったか確認
        await waitFor(() => {
            expect((targetRow as HTMLElement).querySelector('svg.lucide-save')).toBeInTheDocument();
        });

        // 日本語コメント: 左列のよみがなを更新する (getByDisplayValue)
        const leftYomiInput = within(targetRow as HTMLElement).getByDisplayValue('イイン');
        await user.clear(leftYomiInput as HTMLInputElement);
        await user.type(leftYomiInput as HTMLInputElement, 'イイン-NEW');

        // 日本語コメント: 漢字入力を変更 (getByDisplayValue)
        const kanjiInputs = await waitFor(() =>
            within(targetRow as HTMLElement).getAllByDisplayValue(/医院|委員/)
        );
        await user.clear(kanjiInputs[0] as HTMLInputElement);
        await user.type(kanjiInputs[0] as HTMLInputElement, '医院NEW');

        // 日本語コメント: 出題文よみがな入力を変更 (getByDisplayValue)
        const yomiInputs = within(targetRow as HTMLElement).getAllByDisplayValue(/い＿/);
        await user.clear(yomiInputs[0] as HTMLInputElement);
        await user.type(yomiInputs[0] as HTMLInputElement, 'よみNEW');

        // 日本語コメント: 出題文を更新 (getByDisplayValue)
        const sentenceArea = within(targetRow as HTMLElement).getByDisplayValue('＿＿に行く');
        await user.clear(sentenceArea as HTMLTextAreaElement);
        await user.type(sentenceArea as HTMLTextAreaElement, '出題文NEW');

        // 日本語コメント: 保存を押す
        const saveIcon = await waitFor(() =>
            (targetRow as HTMLElement).querySelector('svg.lucide-save')
        );
        const saveButton = saveIcon?.closest('button');
        await user.click(saveButton as HTMLElement);

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    rawWord: '医院NEW',
                    yomigana: 'イイン-NEW',
                    groupMembers: expect.arrayContaining([
                        expect.objectContaining({
                            rawWord: '医院NEW',
                            yomigana: 'イイン-NEW',
                            exampleSentence: '出題文NEW',
                            exampleSentenceYomigana: 'よみNEW',
                        }),
                    ]),
                })
            );
        });
    });

    it('同音異義語で groupMembers が無い場合も出題文よみがなを更新できる', async () => {
        // 日本語コメント: groupMembers の初期値が無い場合の更新分岐を確認する
        setScopes([{ id: 'TEST-01', category: '同音異義語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '同音異義語',
                question: '意味',
                answer: '異例',
                rawWord: '異例',
                yomigana: 'イレイ',
                rawMeaning: '意味',
                exampleSentence: '＿＿な事例',
                exampleSentenceYomigana: 'い＿なじれい',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        const user = userEvent.setup();
        render(<WordList />);

        const row = await screen.findByText('異例');
        const targetRow = row.closest('tr');
        expect(targetRow).not.toBeNull();

        const editIcon = (targetRow as HTMLElement).querySelector('svg.lucide-pen');
        const editButton = editIcon?.closest('button');
        await user.click(editButton as HTMLElement);

        // 日本語コメント: 編集モードに入ったか確認
        await waitFor(() => {
            expect((targetRow as HTMLElement).querySelector('svg.lucide-save')).toBeInTheDocument();
        });

        // 日本語コメント: 漢字を更新する（groupMembers が無いケース）- getByDisplayValue使用
        const kanjiInput = within(targetRow as HTMLElement).getByDisplayValue('異例');
        await user.clear(kanjiInput as HTMLInputElement);
        await user.type(kanjiInput as HTMLInputElement, '異例NEW');

        // 日本語コメント: 出題文を更新する - getByDisplayValue使用
        const sentenceInput = within(targetRow as HTMLElement).getByDisplayValue('＿＿な事例');
        await user.clear(sentenceInput as HTMLTextAreaElement);
        await user.type(sentenceInput as HTMLTextAreaElement, '出題文NEW');

        // 日本語コメント: 出題文よみがなを更新する - getByDisplayValue使用
        const yomiInput = within(targetRow as HTMLElement).getByDisplayValue('い＿なじれい');
        await user.clear(yomiInput as HTMLInputElement);
        await user.type(yomiInput as HTMLInputElement, 'よみNEW');

        const saveIcon = await waitFor(() =>
            (targetRow as HTMLElement).querySelector('svg.lucide-save')
        );
        const saveButton = saveIcon?.closest('button');
        await user.click(saveButton as HTMLElement);

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    groupMembers: expect.arrayContaining([
                        expect.objectContaining({
                            rawWord: '異例NEW',
                            exampleSentence: '出題文NEW',
                            exampleSentenceYomigana: 'よみNEW',
                        }),
                    ]),
                })
            );
        });
    });

    it('同音異義語で groupMembers が空配列の場合に保存できる', async () => {
        // 日本語コメント: groupMembers が空のときの保存分岐を確認する
        setScopes([{ id: 'TEST-01', category: '同音異義語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '同音異義語',
                rawWord: '空配列語',
                yomigana: 'からはいれつ',
                rawMeaning: '意味',
                groupMembers: [],
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        const user = userEvent.setup();
        render(<WordList />);

        const row = await screen.findByText('からはいれつ');
        const targetRow = row.closest('tr');
        expect(targetRow).not.toBeNull();

        const editIcon = (targetRow as HTMLElement).querySelector('svg.lucide-pen');
        const editButton = editIcon?.closest('button');
        await user.click(editButton as HTMLElement);

        const saveIcon = await waitFor(() =>
            (targetRow as HTMLElement).querySelector('svg.lucide-save')
        );
        const saveButton = saveIcon?.closest('button');
        await user.click(saveButton as HTMLElement);

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    groupMembers: [],
                })
            );
        });
    });

    it('類義語カテゴリではヘッダが左右の表記になる', async () => {
        // 日本語コメント: 類義語のテーブルヘッダが専用表示になることを確認する
        setScopes([{ id: 'TEST-01', category: '類義語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '類義語',
                rawWord: '語A',
                yomigana: 'あ',
                rawMeaning: '文A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '語A', yomigana: 'あ', exampleSentence: '文A' },
                    { rawWord: '語B', yomigana: 'び', exampleSentence: '文B' },
                ],
            },
        ]);

        render(<WordList />);

        expect(await screen.findByText('類義語左')).toBeInTheDocument();
        expect(screen.getByText('類義語右')).toBeInTheDocument();
    });

    it('対義語カテゴリではヘッダが対義語表記になる', async () => {
        // 日本語コメント: 対義語のテーブルヘッダを確認する
        setScopes([{ id: 'TEST-01', category: '対義語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '対義語',
                rawWord: '語A',
                rawMeaning: '文A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '語A', yomigana: 'あ', exampleSentence: '', exampleSentenceYomigana: 'ぶんA', customLabel: '上' },
                    { rawWord: '語B', yomigana: 'び', exampleSentence: '', exampleSentenceYomigana: 'ぶんB', customLabel: '下' },
                ],
            },
        ]);

        render(<WordList />);

        expect(await screen.findByText('対義語左')).toBeInTheDocument();
        expect(screen.getByText('対義語右')).toBeInTheDocument();
    });

    it('上下で対となる熟語では右列に例文が表示される', async () => {
        // 日本語コメント: 熟語カテゴリの右列表示を確認する
        setScopes([{ id: 'TEST-01', category: '上下で対となる熟語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '上下で対となる熟語',
                rawWord: '上下',
                yomigana: 'じょうげ',
                rawMeaning: '出題文',
                exampleSentence: '出題文',
                exampleSentenceYomigana: 'しゅつだいぶん',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<WordList />);

        expect(await screen.findByText('熟語')).toBeInTheDocument();
        expect(screen.getByText('例文')).toBeInTheDocument();
        expect(screen.getByText('出題文')).toBeInTheDocument();
        expect(screen.getByText('しゅつだいぶん')).toBeInTheDocument();
    });

    it('ことわざグループではヘッダが「意味 / ことわざ」になる', async () => {
        // 日本語コメント: 似た意味のことわざのヘッダと表示を確認する
        setScopes([{ id: 'TEST-01', category: '似た意味のことわざ', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '似た意味のことわざ',
                rawWord: 'ことわざA',
                yomigana: '意味A',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: 'ことわざA', yomigana: 'よみA', exampleSentence: 'よみA' },
                    { rawWord: 'ことわざB', yomigana: 'よみB', exampleSentence: 'よみB' },
                ],
            },
        ]);

        render(<WordList />);

        expect(await screen.findByText('意味')).toBeInTheDocument();
        expect(screen.getByText('ことわざ')).toBeInTheDocument();
        expect(screen.getByText('意味A')).toBeInTheDocument();
        expect(screen.getByText('ことわざA')).toBeInTheDocument();
        expect(screen.getByText('ことわざB')).toBeInTheDocument();
    });

    it('意味テストが無いカテゴリでは習得の「意味」ドットが表示されない', async () => {
        // 日本語コメント: 類義語カテゴリでは意味テストのドットが無いことを確認する
        setScopes([{ id: 'TEST-01', category: '類義語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '類義語',
                rawWord: '語A',
                rawMeaning: '文A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '語A', yomigana: 'あ', exampleSentence: '文A' },
                    { rawWord: '語B', yomigana: 'び', exampleSentence: '文B' },
                ],
            },
        ]);

        render(<WordList />);

        expect(await screen.findByText('類義語左')).toBeInTheDocument();
        expect(screen.queryByTitle('意味テスト習得')).not.toBeInTheDocument();
    });

    it('類義語カテゴリでは習得済み判定が isLearnedCategory だけで行われる', async () => {
        // 日本語コメント: 意味テストなしカテゴリのフィルタを確認する
        const user = userEvent.setup();
        setScopes([{ id: 'TEST-01', category: '類義語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '類義語',
                rawWord: '習得済み語',
                rawMeaning: '文A',
                isLearnedCategory: true,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '習得済みA', yomigana: 'あ', exampleSentence: '文A' },
                    { rawWord: '習得済みB', yomigana: 'び', exampleSentence: '文B' },
                ],
            },
            {
                id: 2,
                page: 1,
                numberInPage: 2,
                category: '類義語',
                rawWord: '未習得語',
                rawMeaning: '文B',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '未習得A', yomigana: 'し', exampleSentence: '文C' },
                    { rawWord: '未習得B', yomigana: 'で', exampleSentence: '文D' },
                ],
            },
        ]);

        render(<WordList />);

        await screen.findByText('習得済みA');
        const toggle = screen.getByLabelText('習得済みを非表示');
        await user.click(toggle);

        expect(screen.queryByText('習得済みA')).not.toBeInTheDocument();
        expect(screen.getByText('未習得A')).toBeInTheDocument();
    });

    it('慣用句では例文が表示される', async () => {
        // 日本語コメント: 慣用句カテゴリで例文が表示されることを確認する
        setScopes([{ id: 'TEST-01', category: '慣用句', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '慣用句',
                rawWord: '慣用句A',
                rawMeaning: '意味A',
                exampleSentence: '例文A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<WordList />);
        expect(await screen.findByText('例文A')).toBeInTheDocument();
    });

    it('ことわざでは例文が表示されない', async () => {
        // 日本語コメント: ことわざカテゴリでは例文が表示されないことを確認する
        setScopes([{ id: 'TEST-01', category: 'ことわざ', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                rawWord: 'ことわざA',
                rawMeaning: '意味A',
                exampleSentence: '例文A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<WordList />);
        expect(await screen.findByText('ことわざA')).toBeInTheDocument();
        expect(screen.queryByText('例文A')).not.toBeInTheDocument();
    });

    it('類義語編集で出題文よみがなの入力が表示される', async () => {
        // 日本語コメント: 類義語編集時に出題文よみがな入力が出ることを確認する
        setScopes([{ id: 'TEST-01', category: '類義語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '類義語',
                rawWord: '語A',
                yomigana: 'あ',
                rawMeaning: '文A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '語A', yomigana: 'あ', exampleSentence: '文A', exampleSentenceYomigana: 'ぶんA', customLabel: '上' },
                    { rawWord: '語B', yomigana: 'び', exampleSentence: '文B', exampleSentenceYomigana: 'ぶんB', customLabel: '下' },
                ],
            },
        ]);

        const user = userEvent.setup();
        render(<WordList />);

        const row = await screen.findByText('語A');
        const targetRow = row.closest('tr');
        expect(targetRow).not.toBeNull();

        const editIcon = (targetRow as HTMLElement).querySelector('svg.lucide-pen');
        const editButton = editIcon?.closest('button');
        await user.click(editButton as HTMLElement);

        // 日本語コメント: 編集モードに入ったか確認
        await waitFor(() => {
            expect((targetRow as HTMLElement).querySelector('svg.lucide-save')).toBeInTheDocument();
        });

        // 日本語コメント: 出題文よみがなの入力が存在するか - getByDisplayValue使用
        const yomiInputs = within(targetRow as HTMLElement).getAllByDisplayValue(/ぶん[AB]/);
        expect(yomiInputs.length).toBeGreaterThan(0);
    });

    it('類義語編集で左右の語彙を変更して保存できる', async () => {
        // 日本語コメント: 類義語の上下を編集して保存する分岐を確認する
        setScopes([{ id: 'TEST-01', category: '類義語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '類義語',
                rawWord: '語A',
                yomigana: 'あ',
                rawMeaning: '文A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '語A', yomigana: 'あ', exampleSentence: '文A', exampleSentenceYomigana: 'ぶんA', customLabel: '上' },
                    { rawWord: '語B', yomigana: 'び', exampleSentence: '文B', exampleSentenceYomigana: 'ぶんB', customLabel: '下' },
                ],
            },
        ]);

        const user = userEvent.setup();
        render(<WordList />);

        const row = await screen.findByText('語A');
        const targetRow = row.closest('tr');
        expect(targetRow).not.toBeNull();

        const editIcon = (targetRow as HTMLElement).querySelector('svg.lucide-pen');
        const editButton = editIcon?.closest('button');
        await user.click(editButton as HTMLElement);

        const wordInputs = within(targetRow as HTMLElement).getAllByDisplayValue(/語[AB]/);
        await user.clear(wordInputs[0] as HTMLTextAreaElement);
        await user.type(wordInputs[0] as HTMLTextAreaElement, '語A-NEW');
        await user.clear(wordInputs[1] as HTMLTextAreaElement);
        await user.type(wordInputs[1] as HTMLTextAreaElement, '語B-NEW');

        // 日本語コメント: 出題文よみがなと出題文を更新する (config駆動UI対応: DisplayValue使用)
        const sentenceYomiInputs = within(targetRow as HTMLElement).getAllByDisplayValue(/ぶん[AB]/);
        await user.clear(sentenceYomiInputs[0] as HTMLInputElement);
        await user.type(sentenceYomiInputs[0] as HTMLInputElement, 'ぶんA-NEW');
        await user.clear(sentenceYomiInputs[1] as HTMLInputElement);
        await user.type(sentenceYomiInputs[1] as HTMLInputElement, 'ぶんB-NEW');

        const sentenceInputs = within(targetRow as HTMLElement).getAllByDisplayValue(/文[AB]/);
        await user.clear(sentenceInputs[0] as HTMLTextAreaElement);
        await user.type(sentenceInputs[0] as HTMLTextAreaElement, '文A-NEW');
        await user.clear(sentenceInputs[1] as HTMLTextAreaElement);
        await user.type(sentenceInputs[1] as HTMLTextAreaElement, '文B-NEW');

        const categoryDot = within(targetRow as HTMLElement).getByTitle('習得済み');
        await user.click(categoryDot);

        const saveIcon = await waitFor(() =>
            (targetRow as HTMLElement).querySelector('svg.lucide-save')
        );
        const saveButton = saveIcon?.closest('button');
        await user.click(saveButton as HTMLElement);

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    isLearnedCategory: true,
                    groupMembers: expect.arrayContaining([
                        expect.objectContaining({
                            rawWord: '語A-NEW',
                            exampleSentence: '文A-NEW',
                            exampleSentenceYomigana: 'ぶんA-NEW',
                        }),
                        expect.objectContaining({
                            rawWord: '語B-NEW',
                            exampleSentence: '文B-NEW',
                            exampleSentenceYomigana: 'ぶんB-NEW',
                        }),
                    ]),
                })
            );
        });
    });

    it('慣用句の編集でよみがなと語彙と例文を更新できる', async () => {
        // 日本語コメント: 標準カテゴリの編集時に左列の入力が更新されることを確認する
        setScopes([{ id: 'TEST-01', category: '慣用句', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '慣用句',
                rawWord: '慣用句A',
                yomigana: 'かんようく',
                rawMeaning: '意味A',
                exampleSentence: '例文A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        const user = userEvent.setup();
        render(<WordList />);

        const row = await screen.findByText('慣用句A');
        const targetRow = row.closest('tr');
        expect(targetRow).not.toBeNull();

        const editIcon = (targetRow as HTMLElement).querySelector('svg.lucide-pen');
        const editButton = editIcon?.closest('button');
        await user.click(editButton as HTMLElement);

        // 日本語コメント: 編集モードに入ったか確認
        await waitFor(() => {
            expect((targetRow as HTMLElement).querySelector('svg.lucide-save')).toBeInTheDocument();
        });

        // 日本語コメント: よみがな入力を変更する - getByDisplayValue使用
        const yomiInput = within(targetRow as HTMLElement).getByDisplayValue('かんようく');
        await user.clear(yomiInput as HTMLInputElement);
        await user.type(yomiInput as HTMLInputElement, 'かんようくNEW');

        // 日本語コメント: 語彙を変更する
        const wordInput = within(targetRow as HTMLElement).getByDisplayValue('慣用句A');
        await user.clear(wordInput as HTMLTextAreaElement);
        await user.type(wordInput as HTMLTextAreaElement, '慣用句A-NEW');

        // 日本語コメント: 例文を変更する - getByDisplayValue使用
        const sentenceInput = within(targetRow as HTMLElement).getByDisplayValue('例文A');
        await user.clear(sentenceInput as HTMLTextAreaElement);
        await user.type(sentenceInput as HTMLTextAreaElement, '例文A-NEW');

        const saveIcon = await waitFor(() =>
            (targetRow as HTMLElement).querySelector('svg.lucide-save')
        );
        const saveButton = saveIcon?.closest('button');
        await user.click(saveButton as HTMLElement);

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    rawWord: '慣用句A-NEW',
                    yomigana: 'かんようくNEW',
                    exampleSentence: '例文A-NEW',
                })
            );
        });
    });

    it('上下で対となる熟語の編集では出題文入力が表示される', async () => {
        // 日本語コメント: 上下熟語の編集時に右列の出題文入力が出ることを確認する
        setScopes([{ id: 'TEST-01', category: '上下で対となる熟語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '上下で対となる熟語',
                rawWord: '上下',
                yomigana: 'じょうげ',
                rawMeaning: '出題文',
                exampleSentence: '出題文',
                exampleSentenceYomigana: 'しゅつだいぶん',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        const user = userEvent.setup();
        render(<WordList />);

        const row = await screen.findByText('上下');
        const targetRow = row.closest('tr');
        expect(targetRow).not.toBeNull();

        const editIcon = (targetRow as HTMLElement).querySelector('svg.lucide-pen');
        const editButton = editIcon?.closest('button');
        await user.click(editButton as HTMLElement);

        // 日本語コメント: 編集モードに入ったか確認
        await waitFor(() => {
            expect((targetRow as HTMLElement).querySelector('svg.lucide-save')).toBeInTheDocument();
        });

        // 日本語コメント: 出題文よみがなと出題文を変更
        // 日本語コメント: 編集入力を取得 (config駆動UI対応: Placeholder削除につきDisplayValue使用)
        const yomiInput = within(targetRow as HTMLElement).getByDisplayValue('しゅつだいぶん');
        const sentenceInput = within(targetRow as HTMLElement).getByDisplayValue('出題文');

        expect(yomiInput).toBeInTheDocument();
        expect(sentenceInput).toBeInTheDocument();
        expect(yomiInput).toHaveValue('しゅつだいぶん');

        // 日本語コメント: 出題文とよみがなを変更して保存する
        await user.clear(yomiInput as HTMLInputElement);
        await user.type(yomiInput as HTMLInputElement, 'しゅつだいぶんNEW');
        await user.clear(sentenceInput as HTMLTextAreaElement);
        await user.type(sentenceInput as HTMLTextAreaElement, '出題文NEW');

        const saveIcon = await waitFor(() =>
            (targetRow as HTMLElement).querySelector('svg.lucide-save')
        );
        const saveButton = saveIcon?.closest('button');
        await user.click(saveButton as HTMLElement);

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    exampleSentence: '出題文NEW',
                    exampleSentenceYomigana: 'しゅつだいぶんNEW',
                })
            );
        });
    });

    it('ことわざグループ編集では「ふりがな」入力が表示される', async () => {
        // 日本語コメント: ことわざグループの編集時プレースホルダを確認する
        setScopes([{ id: 'TEST-01', category: '似た意味のことわざ', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '似た意味のことわざ',
                rawWord: 'ことわざA',
                yomigana: '意味A',
                rawMeaning: '意味A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: 'ことわざA', yomigana: 'よみA', exampleSentence: 'よみA' },
                ],
            },
        ]);

        const user = userEvent.setup();
        render(<WordList />);

        const row = await screen.findByText('ことわざA');
        const targetRow = row.closest('tr');
        expect(targetRow).not.toBeNull();

        const editIcon = (targetRow as HTMLElement).querySelector('svg.lucide-pen');
        const editButton = editIcon?.closest('button');
        await user.click(editButton as HTMLElement);

        // 日本語コメント: 編集モードに入ったか確認
        await waitFor(() => {
            expect((targetRow as HTMLElement).querySelector('svg.lucide-save')).toBeInTheDocument();
        });

        // 日本語コメント: ふりがな入力が存在するか - getByDisplayValue使用
        expect(within(targetRow as HTMLElement).getByDisplayValue('よみA')).toBeInTheDocument();
        // 日本語コメント: プローブグループはフィールド名に基づくプレースホルダは使用しない
    });

    it('戻るボタンで navigate が呼ばれる', async () => {
        // 日本語コメント: ヘッダ左の戻るボタンで画面遷移することを確認する
        render(<WordList />);

        const backIcon = document.querySelector('svg.lucide-arrow-left');
        const backButton = backIcon?.closest('button');
        const user = userEvent.setup();
        await user.click(backButton as HTMLElement);

        expect(mockNavigate).toHaveBeenCalledWith('/?modal=TEST-01');
    });

    it('データが無い場合は空メッセージが表示される', async () => {
        // 日本語コメント: 単語が無い場合の空表示を確認する
        setScopes([{ id: 'TEST-01', category: 'ことわざ', startPage: 1, endPage: 1 }]);
        setWords([]);

        render(<WordList />);
        expect(await screen.findByText('データがありません')).toBeInTheDocument();
    });

    it('習得済みのみの場合は非表示メッセージが出る', async () => {
        // 日本語コメント: 習得済みのみで非表示にすると専用メッセージが出る
        const user = userEvent.setup();
        setScopes([{ id: 'TEST-01', category: 'ことわざ', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                rawWord: 'MasteredOnly',
                rawMeaning: '意味',
                isLearnedCategory: true,
                isLearnedMeaning: true,
            },
        ]);

        render(<WordList />);
        await screen.findByText('MasteredOnly');

        const toggle = screen.getByLabelText('習得済みを非表示');
        await user.click(toggle);

        expect(await screen.findByText('習得済みの単語を非表示にしています')).toBeInTheDocument();
    });

    it('同訓異字ではヘッダ右列がカテゴリ名になる', async () => {
        // 日本語コメント: 同訓異字の右列ヘッダがカテゴリ名であることを確認する
        setScopes([{ id: 'TEST-01', category: '同訓異字', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '同訓異字',
                rawWord: '字A',
                yomigana: 'ヨミ',
                rawMeaning: '意味',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '字A', yomigana: 'ヨミ', exampleSentence: '＿＿する' },
                ],
            },
        ]);

        render(<WordList />);

        expect(await screen.findByText('よみがな')).toBeInTheDocument();
        expect(screen.getByText('同訓異字')).toBeInTheDocument();
    });
    it('四字熟語では左列に例文が表示され、ヘッダが専用表記になる', async () => {
        // 日本語コメント: 四字熟語のヘッダと左列表示を確認する
        setScopes([{ id: 'TEST-01', category: '四字熟語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '四字熟語',
                rawWord: '四字熟語A',
                yomigana: 'よみA',
                rawMeaning: '意味A',
                exampleSentence: '例文A',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<WordList />);

        expect(await screen.findByText('四字熟語')).toBeInTheDocument(); // ヘッダ確認
        expect(screen.getByText('意味')).toBeInTheDocument(); // 右ヘッダ確認
        expect(screen.getByText('四字熟語A')).toBeInTheDocument();
        expect(screen.getByText('例文A')).toBeInTheDocument(); // 左列に例文がある
    });

    it('同訓異字の右列には例文の強調表示（ヒント）が無い', async () => {
        // 日本語コメント: 同訓異字の右列から不要な例文表示が消えていることを確認する
        setScopes([{ id: 'TEST-01', category: '同訓異字', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '同訓異字',
                rawWord: '字A',
                yomigana: 'ヨミ',
                rawMeaning: '意味',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '字A', yomigana: 'ヨミ', exampleSentence: '例文A' },
                ],
            },
        ]);

        render(<WordList />);

        // 例文Aが表示されているか確認 (右下の普通の例文としては表示されるはずだが、右上のBoldヒントとしては消えているべき)
        const examples = await screen.findAllByText('例文A');
        expect(examples).toHaveLength(1);
        // クラス名で念のため確認（下部のクラス）
        expect(examples[0]).toHaveClass('text-sm');
        expect(examples[0]).not.toHaveClass('font-bold');
    });



    it('通常のカテゴリー（四字熟語など）の左列は太字で表示される', async () => {
        (useParams as any).mockReturnValue({ scopeId: 'TEST-NORMAL' });
        setScopes([{ id: 'TEST-NORMAL', category: '四字熟語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: '四字熟語',
                rawWord: '四字熟語B',
                yomigana: 'よみ',
                rawMeaning: '意味',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            }
        ]);

        render(<WordList />);

        const wordText = await screen.findByText('四字熟語B');
        expect(wordText).toHaveClass('font-bold');
        expect(wordText).toHaveClass('text-lg');
    });
});
