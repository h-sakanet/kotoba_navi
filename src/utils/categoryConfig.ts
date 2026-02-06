import type { Category } from '../types';

export type LayoutType =
    | 'standard'
    | 'homonym'
    | 'synonym'
    | 'pair_sentence'
    | 'proverb_group';

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

    // オプション
    hideQuestionList?: boolean;   // ことわざグループ: 出題時にリストを隠し、件数ヒントのみ出す
    showGroupCountHint?: boolean; // ことわざグループ: 「答えはNつあります」表示
}

export interface CategorySettings {
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

export const CATEGORY_SETTINGS: Record<Category, CategorySettings> = {
    // ----------------------------------------------------------------
    // 1. 標準的なことわざ (Proverbs)
    // ----------------------------------------------------------------
    'ことわざ': {
        wordList: {
            layout: 'standard',
            headerLabels: { left: 'ことわざ', right: '意味' },
            styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
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
                label: 'ことわざテスト',
                layout: 'standard',
                question: [[{ type: 'field', field: 'meaning', role: 'main' }]],
                answer: [
                    [{ type: 'field', field: 'meaning', role: 'main' }], // 出題(意味)を表示
                    [{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'answer' }]
                ],
                updatesLearned: 'category'
            },
            {
                id: 'meaning',
                label: '意味テスト',
                layout: 'standard',
                question: [[{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'main' }]],
                answer: [
                    [{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'main' }], // 出題(単語)を表示
                    [{ type: 'field', field: 'meaning', role: 'answer' }]
                ],
                updatesLearned: 'meaning'
            }
        ]
    },
    // ----------------------------------------------------------------
    // 2. 慣用句・熟語 (Idioms)
    // ----------------------------------------------------------------
    '慣用句': {
        wordList: {
            layout: 'standard',
            headerLabels: { left: '慣用句', right: '意味' },
            styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
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
                label: '慣用句テスト',
                layout: 'standard',
                question: [[{ type: 'field', field: 'meaning', role: 'main' }], [{ type: 'field', field: 'example', role: 'sentence' }]],
                answer: [
                    [{ type: 'field', field: 'meaning', role: 'main' }, { type: 'field', field: 'example', role: 'sentence' }],
                    [{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'answer' }]
                ],
                updatesLearned: 'category'
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
                updatesLearned: 'meaning'
            }
        ]
    },
    '四字熟語': {
        wordList: {
            layout: 'standard',
            headerLabels: { left: '四字熟語', right: '意味' },
            styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
            left: [
                [{ type: 'field', field: 'yomigana', role: 'sub', masked: true }, { type: 'field', field: 'word', role: 'main', masked: true }],
                [{ type: 'field', field: 'example', role: 'sentence' }]
            ],
            right: [
                [{ type: 'field', field: 'meaning', role: 'sentence', masked: true }]
            ]
        },
        tests: [
            {
                id: 'category',
                label: '四字熟語テスト',
                layout: 'standard',
                question: [[{ type: 'field', field: 'meaning', role: 'main' }], [{ type: 'field', field: 'example', role: 'sentence' }]],
                answer: [
                    [{ type: 'field', field: 'meaning', role: 'main' }, { type: 'field', field: 'example', role: 'sentence' }],
                    [{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'answer' }]
                ],
                updatesLearned: 'category'
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
                updatesLearned: 'meaning'
            }
        ]
    },
    '三字熟語': {
        wordList: {
            layout: 'standard',
            headerLabels: { left: '三字熟語', right: '意味' },
            styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
            left: [
                [{ type: 'field', field: 'yomigana', role: 'sub', masked: true }, { type: 'field', field: 'word', role: 'main', masked: true }],
                [{ type: 'field', field: 'example', role: 'sentence' }]
            ],
            right: [
                [{ type: 'field', field: 'meaning', role: 'sentence', masked: true }]
            ]
        },
        tests: [
            {
                id: 'category',
                label: '三字熟語テスト',
                layout: 'standard',
                question: [[{ type: 'field', field: 'meaning', role: 'main' }], [{ type: 'field', field: 'example', role: 'sentence' }]],
                answer: [
                    [{ type: 'field', field: 'meaning', role: 'main' }, { type: 'field', field: 'example', role: 'sentence' }],
                    [{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'answer' }]
                ],
                updatesLearned: 'category'
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
                updatesLearned: 'meaning'
            }
        ]
    },
    '類義語': {
        wordList: {
            layout: 'synonym',
            headerLabels: { left: '類義語左', right: '類義語右' },
            styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
            left: [[{ type: 'group_members', mode: 'synonym_pair', fields: ['yomigana', 'word', 'example_yomigana', 'example'], memberIndex: 0, orderBy: 'none', maskFields: ['yomigana', 'word'] }]],
            right: [[{ type: 'group_members', mode: 'synonym_pair', fields: ['yomigana', 'word', 'example_yomigana', 'example'], memberIndex: 1, orderBy: 'none', maskFields: ['yomigana', 'word'] }]],
            groupMembers: {
                mode: 'synonym_pair',
                fields: ['yomigana', 'word', 'example_yomigana', 'example'],
                orderBy: 'none'
            }
        },
        tests: [
            {
                id: 'category',
                label: '類義語テスト',
                layout: 'synonym_list',
                question: [[{ type: 'group_members', mode: 'synonym_pair', fields: ['example_yomigana', 'example'], orderBy: 'none' }]],
                answer: [[{ type: 'group_members', mode: 'sentence_fill', fields: ['example_yomigana', 'example'], orderBy: 'none' }]],
                updatesLearned: 'category'
            }
        ]
    },
    '対義語': {
        wordList: {
            layout: 'synonym',
            headerLabels: { left: '対義語左', right: '対義語右' },
            styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
            left: [[{ type: 'group_members', mode: 'synonym_pair', fields: ['yomigana', 'word', 'example_yomigana', 'example'], memberIndex: 0, orderBy: 'none', maskFields: ['yomigana', 'word'] }]],
            right: [[{ type: 'group_members', mode: 'synonym_pair', fields: ['yomigana', 'word', 'example_yomigana', 'example'], memberIndex: 1, orderBy: 'none', maskFields: ['yomigana', 'word'] }]],
            groupMembers: {
                mode: 'synonym_pair',
                fields: ['yomigana', 'word', 'example_yomigana', 'example'],
                orderBy: 'none'
            }
        },
        tests: [
            {
                id: 'category',
                label: '対義語テスト',
                layout: 'synonym_list',
                question: [[{ type: 'group_members', mode: 'synonym_pair', fields: ['example_yomigana', 'example'], orderBy: 'none' }]],
                answer: [[{ type: 'group_members', mode: 'sentence_fill', fields: ['example_yomigana', 'example'], orderBy: 'none' }]],
                updatesLearned: 'category'
            }
        ]
    },
    '同音異義語': {
        wordList: {
            layout: 'homonym',
            headerLabels: { left: 'よみがな', right: '同音異義語' },
            styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
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
                label: '同音異義語テスト',
                layout: 'homonym_fill',
                question: [[{ type: 'field', field: 'yomigana', role: 'main' }], [{ type: 'group_members', mode: 'homonym_fill', fields: ['example_yomigana', 'example'], orderBy: 'none' }]],
                answer: [[{ type: 'field', field: 'yomigana', role: 'main' }], [{ type: 'group_members', mode: 'homonym_fill', fields: ['example_yomigana', 'example', 'word'], orderBy: 'none' }]],
                updatesLearned: 'category'
            }
        ]
    },
    '同訓異字': {
        wordList: {
            layout: 'homonym',
            headerLabels: { left: 'よみがな', right: '同訓異字' },
            styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
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
                label: '同訓異字テスト',
                layout: 'homonym_fill',
                question: [[{ type: 'field', field: 'yomigana', role: 'main' }], [{ type: 'group_members', mode: 'homonym_fill', fields: ['example_yomigana', 'example'], orderBy: 'none' }]],
                answer: [[{ type: 'field', field: 'yomigana', role: 'main' }], [{ type: 'group_members', mode: 'homonym_fill', fields: ['example_yomigana', 'example', 'word'], orderBy: 'none' }]],
                updatesLearned: 'category'
            }
        ]
    },
    '似た意味のことわざ': {
        wordList: {
            layout: 'proverb_group',
            headerLabels: { left: '意味', right: 'ことわざ' },
            styles: { mainTextSize: 'base', mainTextWeight: 'normal' },
            left: [[{ type: 'field', field: 'meaning', role: 'main' }]],
            right: [[{ type: 'group_members', mode: 'proverb_group', fields: ['yomigana', 'word'], orderBy: 'none', maskFields: ['yomigana', 'word'] }]]
        },
        tests: [
            {
                id: 'category',
                label: 'ことわざテスト',
                layout: 'proverb_group',
                question: [[{ type: 'field', field: 'meaning', role: 'main' }], []],
                answer: [[{ type: 'field', field: 'meaning', role: 'main' }], [{ type: 'group_members', mode: 'proverb_group', fields: ['yomigana', 'word'], orderBy: 'none' }]],
                updatesLearned: 'category',
                showGroupCountHint: true
            }
        ]
    },
    '対になることわざ': {
        wordList: {
            layout: 'proverb_group',
            headerLabels: { left: '意味', right: 'ことわざ' },
            styles: { mainTextSize: 'base', mainTextWeight: 'normal' },
            left: [[{ type: 'field', field: 'meaning', role: 'main' }]],
            right: [[{ type: 'group_members', mode: 'proverb_group', fields: ['yomigana', 'word'], orderBy: 'customLabel', showCustomLabel: true, maskFields: ['yomigana', 'word'] }]]
        },
        tests: [
            {
                id: 'category',
                label: 'ことわざテスト',
                layout: 'proverb_group',
                question: [[{ type: 'field', field: 'meaning', role: 'main' }], []],
                answer: [[{ type: 'field', field: 'meaning', role: 'main' }], [{ type: 'group_members', mode: 'proverb_group', fields: ['yomigana', 'word'], orderBy: 'customLabel', showCustomLabel: true }]],
                updatesLearned: 'category',
                showGroupCountHint: true
            }
        ]
    },
    // ----------------------------------------------------------------
    // 8. 上下で対となる熟語 (Paired Idioms)
    // ----------------------------------------------------------------
    '上下で対となる熟語': {
        wordList: {
            layout: 'pair_sentence',
            headerLabels: { left: '熟語', right: '例文' },
            styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
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
                label: '熟語テスト',
                layout: 'standard',
                question: [[{ type: 'field', field: 'example_yomigana', role: 'sub' }], [{ type: 'field', field: 'example', role: 'main' }]],
                answer: [[{ type: 'field', field: 'example_yomigana', role: 'sub' }], [{ type: 'field', field: 'example', role: 'answer', transform: 'sentence_fill' }]],
                updatesLearned: 'category'
            }
        ]
    },
};
