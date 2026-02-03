import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseAndImportCSV } from './csvImporter';

// --- モック定義 ---
const {
    setParseData,
    getParseData,
    getBulkAdded,
    getDeletedPages,
    resetState,
    mockBulkAdd,
    mockDelete,
} = vi.hoisted(() => {
    let parseData: string[][] = [];
    let bulkAdded: any[] | null = null;
    const deletedPages: number[] = [];
    const mockBulkAdd = vi.fn((rows: any[]) => {
        bulkAdded = rows;
    });
    const mockDelete = vi.fn((page: number) => {
        deletedPages.push(page);
    });
    return {
        setParseData: (next: string[][]) => {
            parseData = next;
        },
        getParseData: () => parseData,
        getBulkAdded: () => bulkAdded,
        getDeletedPages: () => [...deletedPages],
        resetState: () => {
            parseData = [];
            bulkAdded = null;
            deletedPages.length = 0;
            mockBulkAdd.mockClear();
            mockDelete.mockClear();
        },
        mockBulkAdd,
        mockDelete,
    };
});

vi.mock('papaparse', () => ({
    default: {
        parse: (_file: File, config: any) => {
            // 日本語コメント: Papa.parseのcompleteを即時に呼び出す
            config.complete({ data: getParseData() });
        },
    },
}));

vi.mock('../db', () => ({
    db: {
        words: {
            where: (_field: string) => ({
                equals: (page: number) => ({
                    delete: () => mockDelete(page),
                }),
            }),
            bulkAdd: (arr: any[]) => mockBulkAdd(arr),
        },
        transaction: async (_mode: string, _table: unknown, fn: () => Promise<void>) => fn(),
    },
}));

vi.mock('../data/scope.ts', () => ({
    SCOPES: [
        { id: 'SYN-01', startPage: 10, endPage: 10, category: '類義語' },
        { id: 'HOM-01', startPage: 12, endPage: 12, category: '同音異義語' },
        { id: 'PRV-01', startPage: 34, endPage: 34, category: '似た意味のことわざ' },
        { id: 'PAI-01', startPage: 101, endPage: 101, category: '上下で対となる熟語' },
    ],
}));

describe('parseAndImportCSV', () => {
    beforeEach(() => {
        // 日本語コメント: テストごとに状態を初期化する
        resetState();
    });

    it('類義語のCSVはgroupMembersとして取り込まれる', async () => {
        // 日本語コメント: 類義語の10列形式が1件にまとまることを確認する
        setParseData([
            ['ヘッダ', 'No', 'A', 'B', 'C'],
            ['10', '1', '語A', 'あ', '文A', 'ぶんA', '語B', 'び', '文B', 'ぶんB'],
        ]);

        await parseAndImportCSV(new File(['dummy'], 'test.csv'));

        const added = getBulkAdded();
        expect(added).not.toBeNull();
        expect(added).toHaveLength(1);
        expect(added?.[0].category).toBe('類義語');
        expect(added?.[0].groupMembers).toHaveLength(2);
        expect(added?.[0].groupMembers[0].customLabel).toBe('上');
        expect(added?.[0].groupMembers[1].customLabel).toBe('下');

        // 日本語コメント: ページ削除が行われることを確認する
        expect(getDeletedPages()).toContain(10);
    });

    it('同音異義語のCSVは同一番号でグルーピングされる', async () => {
        // 日本語コメント: 同音異義語の複数行がgroupMembersにまとめられることを確認する
        setParseData([
            ['ヘッダ', 'No', 'Yomi', 'Kanji', 'Sentence', 'SentenceYomi'],
            ['12', '3', 'イイン', '医院', '＿＿に行く', 'い＿にいく'],
            ['12', '3', 'イイン', '委員', '＿＿になる', 'い＿になる'],
        ]);

        await parseAndImportCSV(new File(['dummy'], 'test.csv'));

        const added = getBulkAdded();
        expect(added).not.toBeNull();
        expect(added).toHaveLength(1);
        expect(added?.[0].category).toBe('同音異義語');
        expect(added?.[0].groupMembers).toHaveLength(2);
        expect(added?.[0].groupMembers[0].rawWord).toBe('医院');
        expect(added?.[0].groupMembers[1].rawWord).toBe('委員');

        // 日本語コメント: ページ削除が行われることを確認する
        expect(getDeletedPages()).toContain(12);
    });

    it('空CSVでもエラーにならず何も追加されない', async () => {
        // 日本語コメント: データ無しの場合は bulkAdd が呼ばれないことを確認する
        setParseData([]);

        await parseAndImportCSV(new File(['dummy'], 'empty.csv'));

        expect(mockBulkAdd).not.toHaveBeenCalled();
        expect(getDeletedPages()).toHaveLength(0);
    });

    it('不正な行は無視され、正常な行だけが取り込まれる', async () => {
        // 日本語コメント: 欠損行をスキップし、正常行のみが追加されることを確認する
        setParseData([
            ['ヘッダ', 'No', 'A', 'B', 'C'],
            ['10', '1', '', '', ''], // 不正行
            ['10', '2', '語A', 'あ', '文A', 'ぶんA', '語B', 'び', '文B', 'ぶんB'], // 正常行
        ]);

        await parseAndImportCSV(new File(['dummy'], 'mixed.csv'));

        const added = getBulkAdded();
        expect(added).not.toBeNull();
        expect(added).toHaveLength(1);
        expect(added?.[0].numberInPage).toBe(2);
    });

    it('スコープ外のページはカテゴリが「その他」になる', async () => {
        // 日本語コメント: 対象外ページのカテゴリが「その他」になることを確認する
        setParseData([
            ['99', '1', '語彙', 'よみ', '意味'],
        ]);

        await parseAndImportCSV(new File(['dummy'], 'out-of-scope.csv'));

        const added = getBulkAdded();
        expect(added).not.toBeNull();
        expect(added).toHaveLength(1);
        expect(added?.[0].category).toBe('その他');
        expect(getDeletedPages()).toContain(99);
    });

    it('ことわざグループのCSVはProverbGroupImporterの形で取り込まれる', async () => {
        // 日本語コメント: 似た意味のことわざが専用ロジックで取り込まれることを確認する
        setParseData([
            ['34', '1', 'ことわざA', 'よみA', '意味A'],
            ['34', '1', 'ことわざB', 'よみB', '意味A'],
        ]);

        await parseAndImportCSV(new File(['dummy'], 'proverb.csv'));

        const added = getBulkAdded();
        expect(added).not.toBeNull();
        expect(added).toHaveLength(1);
        expect(added?.[0].category).toBe('似た意味のことわざ');
        expect(added?.[0].yomigana).toBe('意味A');
        expect(added?.[0].groupMembers).toHaveLength(2);
        expect(added?.[0].groupMembers[0].rawWord).toBe('ことわざA');
        expect(added?.[0].groupMembers[1].rawWord).toBe('ことわざB');
    });

    it('上下で対となる熟語はPairedIdiomImporterの形で取り込まれる', async () => {
        // 日本語コメント: 熟語＋出題文形式の取り込みを確認する
        setParseData([
            ['101', '1', '上下', 'じょうげ', '出題文', 'しゅつだいぶん'],
        ]);

        await parseAndImportCSV(new File(['dummy'], 'paired.csv'));

        const added = getBulkAdded();
        expect(added).not.toBeNull();
        expect(added).toHaveLength(1);
        expect(added?.[0].category).toBe('上下で対となる熟語');
        expect(added?.[0].rawWord).toBe('上下');
        expect(added?.[0].question).toBe('出題文');
        expect(added?.[0].exampleSentence).toBe('出題文');
    });
});
