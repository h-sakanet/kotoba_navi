import type { Category } from '../types';

export type LayoutType =
    | 'standard'
    | 'homonym'
    | 'synonym'
    | 'pair_sentence'
    | 'proverb_group';

export type ImporterKind =
    | 'standard'
    | 'idiom'
    | 'synonym'
    | 'homonym'
    | 'similar_proverb'
    | 'paired_proverb'
    | 'paired_idiom';

// テスト画面の表示レイアウト識別子
export type TestLayoutType =
    | 'standard'        // 通常カード (中央表示)
    | 'homonym_fill'    // 同音異義語: 虫食い穴埋めリスト
    | 'proverb_group'   // ことわざグループ: ふりがな付きリスト
    | 'synonym_list'    // 類義語/対義語: 左右並列リスト
    | 'pair_sentence';  // 上下で対となる熟語

// 表示するデータのパーツ識別子
export type FieldType =
    | 'word'              // 単語 (ことわざ、慣用句など)
    | 'meaning'           // 意味
    | 'yomigana'          // 単語のよみがな
    | 'example'           // 例文
    | 'example_yomigana'; // 例文のよみがな

export type GroupMembersMode =
    | 'synonym_pair'
    | 'homonym_fill'
    | 'proverb_group'
    | 'homonym_list'
    | 'sentence_fill'; // 例文穴埋め（類義語/対義語の解答）

export type FieldTransform = 'sentence_fill'; // exampleフィールドのみ適用可（例文内の「＿＿」を word で埋める）

export type FieldStyleRole =
    | 'sub'       // 小さめ表示
    | 'main'      // 太字・大きめ表示
    | 'sentence'  // 例文向け
    | 'answer';   // テスト解答向け

export type FieldSpec =
    | { type: 'field'; field: FieldType; role?: FieldStyleRole; transform?: FieldTransform; masked?: boolean }
    | {
        type: 'group_members';
        mode: GroupMembersMode;
        fields: FieldType[]; // グループメンバー内の表示順
        role?: FieldStyleRole;
        memberIndex?: number; // 指定時は該当メンバーのみ描画（例: synonymの左右分割）
        showCustomLabel?: boolean; // 上/下などのラベルを表示する（表示形式は現行UIに合わせる）
        orderBy?: 'customLabel' | 'none'; // グループ内の並び順（none=CSV出現順）
        maskFields?: FieldType[]; // マスク対象フィールド
        masked?: boolean; // グループ全体をマスクするか
    };

// 1つのブロック（縦に並ぶ単位）
export type FieldGroup = FieldSpec[];

export interface TestConfig {
    id: string;    // URLパラメータ (例: 'category', 'meaning')
    label: string; // テスト画面ヘッダー

    // 出題/解答データ: 複数の要素を順に表示
    question: FieldGroup[];
    answer: FieldGroup[];

    layout: TestLayoutType;

    // 学習フラグ更新対象
    updatesLearned: 'category' | 'meaning';
    retryUnlockSide: 'left' | 'right';

    // オプション
    hideQuestionList?: boolean;   // ことわざグループ: 出題時にリストを隠し、件数ヒントのみ出す
    showGroupCountHint?: boolean; // ことわざグループ: 「答えはNつあります」表示
}

export interface CategorySettings {
    importerKind: ImporterKind;
    learningDashboard: {
        titleSource: 'left' | 'right' | 'left_right_pair';
    };
    wordList: {
        layout: LayoutType;
        headerLabels: {
            left: string;
            right: string;
        };
        styles: {
            mainTextSize: 'base' | 'lg';
            mainTextWeight: 'normal' | 'bold';
        };
        editBehavior: {
            syncParentYomiganaToGroupMembers: boolean;
        };

        // 標準レイアウトのみに使用
        left?: FieldGroup[];
        right?: FieldGroup[];

        // 同音異義語/ことわざグループ/類義語などの専用レイアウト用
        groupMembers?: {
            mode: GroupMembersMode;
            fields: FieldType[];
            showCustomLabel?: boolean;
            orderBy?: 'customLabel' | 'none';
        };
    };
    tests: TestConfig[];
}

const createIdiomCategorySettings = (categoryName: string): CategorySettings => ({
    importerKind: 'idiom',
    learningDashboard: { titleSource: 'left' },
    wordList: {
        layout: 'standard',
        headerLabels: { left: categoryName, right: '意味' },
        styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
        editBehavior: { syncParentYomiganaToGroupMembers: false },
        left: [
            [
                { type: 'field', field: 'yomigana', role: 'sub', masked: true },
                { type: 'field', field: 'word', role: 'main', masked: true }
            ],
            [{ type: 'field', field: 'example', role: 'sentence' }]
        ],
        right: [
            [{ type: 'field', field: 'meaning', role: 'sentence', masked: true }]
        ]
    },
    tests: [
        {
            id: 'category',
            label: `${categoryName}テスト`,
            layout: 'standard',
            question: [[{ type: 'field', field: 'meaning', role: 'main' }], [{ type: 'field', field: 'example', role: 'sentence' }]],
            answer: [
                [{ type: 'field', field: 'meaning', role: 'main' }, { type: 'field', field: 'example', role: 'sentence' }],
                [{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'answer' }]
            ],
            updatesLearned: 'category',
            retryUnlockSide: 'left'
        },
        {
            id: 'meaning',
            label: '意味テスト',
            layout: 'standard',
            question: [[{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'main' }]],
            answer: [
                [{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'main' }],
                [{ type: 'field', field: 'meaning', role: 'answer' }]
            ],
            updatesLearned: 'meaning',
            retryUnlockSide: 'right'
        }
    ]
});

const createProverbCategorySettings = (categoryName: string, testLabel: string = `${categoryName}テスト`): CategorySettings => ({
    importerKind: 'standard',
    learningDashboard: { titleSource: 'left' },
    wordList: {
        layout: 'standard',
        headerLabels: { left: categoryName, right: '意味' },
        styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
        editBehavior: { syncParentYomiganaToGroupMembers: false },
        left: [
            [{ type: 'field', field: 'yomigana', role: 'sub', masked: true }, { type: 'field', field: 'word', role: 'main', masked: true }]
        ],
        right: [
            [{ type: 'field', field: 'meaning', role: 'sentence', masked: true }]
        ]
    },
    tests: [
        {
            id: 'category',
            label: testLabel,
            layout: 'standard',
            question: [[{ type: 'field', field: 'meaning', role: 'main' }]],
            answer: [
                [{ type: 'field', field: 'meaning', role: 'main' }],
                [{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'answer' }]
            ],
            updatesLearned: 'category',
            retryUnlockSide: 'left'
        },
        {
            id: 'meaning',
            label: '意味テスト',
            layout: 'standard',
            question: [[{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'main' }]],
            answer: [
                [{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'main' }],
                [{ type: 'field', field: 'meaning', role: 'answer' }]
            ],
            updatesLearned: 'meaning',
            retryUnlockSide: 'right'
        }
    ]
});

const createSynonymPairCategorySettings = (leftHeader: string, rightHeader: string, testLabel: string): CategorySettings => ({
    importerKind: 'synonym',
    learningDashboard: { titleSource: 'left_right_pair' },
    wordList: {
        layout: 'synonym',
        headerLabels: { left: leftHeader, right: rightHeader },
        styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
        editBehavior: { syncParentYomiganaToGroupMembers: false },
        left: [
            [{ type: 'group_members', mode: 'synonym_pair', fields: ['yomigana', 'word'], memberIndex: 0, orderBy: 'none', maskFields: ['yomigana', 'word'] }],
            [{ type: 'group_members', mode: 'synonym_pair', fields: ['example_yomigana', 'example'], memberIndex: 0, orderBy: 'none' }]
        ],
        right: [
            [{ type: 'group_members', mode: 'synonym_pair', fields: ['yomigana', 'word'], memberIndex: 1, orderBy: 'none', maskFields: ['yomigana', 'word'] }],
            [{ type: 'group_members', mode: 'synonym_pair', fields: ['example_yomigana', 'example'], memberIndex: 1, orderBy: 'none' }]
        ],
        groupMembers: {
            mode: 'synonym_pair',
            fields: ['yomigana', 'word', 'example_yomigana', 'example'],
            orderBy: 'none'
        }
    },
    tests: [
        {
            id: 'category',
            label: testLabel,
            layout: 'synonym_list',
            question: [[{ type: 'group_members', mode: 'synonym_pair', fields: ['example_yomigana', 'example'], orderBy: 'none' }]],
            answer: [[{ type: 'group_members', mode: 'sentence_fill', fields: ['example_yomigana', 'example'], orderBy: 'none' }]],
            updatesLearned: 'category',
            retryUnlockSide: 'left'
        }
    ]
});

const createHomonymCategorySettings = (rightHeader: string, testLabel: string): CategorySettings => ({
    importerKind: 'homonym',
    learningDashboard: { titleSource: 'right' },
    wordList: {
        layout: 'homonym',
        headerLabels: { left: 'よみがな', right: rightHeader },
        styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
        editBehavior: { syncParentYomiganaToGroupMembers: true },
        left: [[{ type: 'field', field: 'yomigana', role: 'main' }]],
        right: [[{ type: 'group_members', mode: 'homonym_list', fields: ['word', 'example_yomigana', 'example'], orderBy: 'none', maskFields: ['word'] }]],
        groupMembers: {
            mode: 'homonym_list',
            fields: ['word', 'example_yomigana', 'example'],
            orderBy: 'none'
        }
    },
    tests: [
        {
            id: 'category',
            label: testLabel,
            layout: 'homonym_fill',
            question: [[{ type: 'field', field: 'yomigana', role: 'main' }], [{ type: 'group_members', mode: 'homonym_fill', fields: ['example_yomigana', 'example'], orderBy: 'none' }]],
            answer: [[{ type: 'field', field: 'yomigana', role: 'main' }], [{ type: 'group_members', mode: 'homonym_fill', fields: ['example_yomigana', 'example', 'word'], orderBy: 'none' }]],
            updatesLearned: 'category',
            retryUnlockSide: 'right'
        }
    ]
});

const createPairedSentenceCategorySettings = (
    leftHeader: string = '熟語',
    rightHeader: string = '例文',
    testLabel: string = '熟語テスト'
): CategorySettings => ({
    importerKind: 'paired_idiom',
    learningDashboard: { titleSource: 'left' },
    wordList: {
        layout: 'pair_sentence',
        headerLabels: { left: leftHeader, right: rightHeader },
        styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
        editBehavior: { syncParentYomiganaToGroupMembers: false },
        left: [
            [{ type: 'field', field: 'yomigana', role: 'sub', masked: true }, { type: 'field', field: 'word', role: 'main', masked: true }]
        ],
        right: [
            [{ type: 'field', field: 'example_yomigana', role: 'sub' }, { type: 'field', field: 'example', role: 'sentence' }]
        ]
    },
    tests: [
        {
            id: 'category',
            label: testLabel,
            layout: 'standard',
            question: [[{ type: 'field', field: 'example_yomigana', role: 'sub' }], [{ type: 'field', field: 'example', role: 'main' }]],
            answer: [[{ type: 'field', field: 'example_yomigana', role: 'sub' }], [{ type: 'field', field: 'example', role: 'answer', transform: 'sentence_fill' }]],
            updatesLearned: 'category',
            retryUnlockSide: 'left'
        }
    ]
});

const createProverbGroupCategorySettings = (
    importerKind: 'similar_proverb' | 'paired_proverb',
    orderBy: 'none' | 'customLabel',
    showCustomLabel: boolean = false
): CategorySettings => ({
    importerKind,
    learningDashboard: { titleSource: 'right' },
    wordList: {
        layout: 'proverb_group',
        headerLabels: { left: '意味', right: 'ことわざ' },
        styles: { mainTextSize: 'base', mainTextWeight: 'normal' },
        editBehavior: { syncParentYomiganaToGroupMembers: false },
        left: [[{ type: 'field', field: 'meaning', role: 'main' }]],
        right: [[{
            type: 'group_members',
            mode: 'proverb_group',
            fields: ['yomigana', 'word'],
            orderBy,
            ...(showCustomLabel ? { showCustomLabel: true } : {}),
            maskFields: ['yomigana', 'word']
        }]]
    },
    tests: [
        {
            id: 'category',
            label: 'ことわざテスト',
            layout: 'proverb_group',
            question: [[{ type: 'field', field: 'meaning', role: 'main' }], []],
            answer: [[{ type: 'field', field: 'meaning', role: 'main' }], [{
                type: 'group_members',
                mode: 'proverb_group',
                fields: ['yomigana', 'word'],
                orderBy,
                ...(showCustomLabel ? { showCustomLabel: true } : {})
            }]],
            updatesLearned: 'category',
            retryUnlockSide: 'right',
            showGroupCountHint: true
        }
    ]
});

export const CATEGORY_SETTINGS: Record<Category, CategorySettings> = {
    // ----------------------------------------------------------------
    // 1. 標準的なことわざ (Proverbs)
    // ----------------------------------------------------------------
    'ことわざ': createProverbCategorySettings('ことわざ', 'ことわざテスト'),
    // ----------------------------------------------------------------
    // 2. 慣用句・熟語 (Idioms)
    // ----------------------------------------------------------------
    '慣用句': createIdiomCategorySettings('慣用句'),
    '四字熟語': createIdiomCategorySettings('四字熟語'),
    '三字熟語': createIdiomCategorySettings('三字熟語'),
    '類義語': createSynonymPairCategorySettings('類義語左', '類義語右', '類義語テスト'),
    '対義語': createSynonymPairCategorySettings('対義語左', '対義語右', '対義語テスト'),
    '同音異義語': createHomonymCategorySettings('同音異義語', '同音異義語テスト'),
    '同訓異字': createHomonymCategorySettings('同訓異字', '同訓異字テスト'),
    '似た意味のことわざ': createProverbGroupCategorySettings('similar_proverb', 'none'),
    '対になることわざ': createProverbGroupCategorySettings('paired_proverb', 'customLabel', true),
    // ----------------------------------------------------------------
    // 3. 上下で対となる熟語 (Paired Idioms)
    // ----------------------------------------------------------------
    '上下で対となる熟語': createPairedSentenceCategorySettings(),
};
