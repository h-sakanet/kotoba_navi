# 設計書一式 (Design Spec)

このドキュメントは、カテゴリ設定・WordList・Test・CSVインポート仕様を統合した設計書です。

---

## 1. 設定実装仕様書 (Configuration Implementation Spec)

### 1.1 型定義 (Type Definitions)

```typescript
import { Category } from '../types';

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
  | { type: 'field'; field: FieldType; role?: FieldStyleRole; transform?: FieldTransform }
  | {
      type: 'group_members';
      mode: GroupMembersMode;
      fields: FieldType[]; // グループメンバー内の表示順
      role?: FieldStyleRole;
      showCustomLabel?: boolean; // 上/下などのラベルを表示する（表示形式は現行UIの見た目に合わせる）
      orderBy?: 'customLabel' | 'none'; // グループ内の並び順（none=CSV出現順）
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
```

### 1.2 設定マップ (Configuration Map)

```typescript
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
        [{ type: 'field', field: 'yomigana', role: 'sub' }],
        [{ type: 'field', field: 'word', role: 'main' }]
      ],
      right: [
        [{ type: 'field', field: 'meaning', role: 'sentence' }]
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
        [{ type: 'field', field: 'yomigana', role: 'sub' }],
        [{ type: 'field', field: 'word', role: 'main' }],
        [{ type: 'field', field: 'example', role: 'sentence' }]
      ],
      right: [
        [{ type: 'field', field: 'meaning', role: 'sentence' }]
      ]
    },
    tests: [
      {
        id: 'category',
        label: '慣用句テスト',
        layout: 'standard',
        question: [[{ type: 'field', field: 'meaning', role: 'main' }], [{ type: 'field', field: 'example', role: 'sentence' }]],
        answer: [
          [{ type: 'field', field: 'meaning', role: 'main' }, { type: 'field', field: 'example', role: 'sentence' }], // 出題(意味+例文)を表示
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
  '四字熟語': {
    wordList: {
      layout: 'standard',
      headerLabels: { left: '四字熟語', right: '意味' },
      styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
      left: [
        [{ type: 'field', field: 'yomigana', role: 'sub' }],
        [{ type: 'field', field: 'word', role: 'main' }],
        [{ type: 'field', field: 'example', role: 'sentence' }]
      ],
      right: [
        [{ type: 'field', field: 'meaning', role: 'sentence' }]
      ]
    },
    tests: [
      {
        id: 'category',
        label: '四字熟語テスト',
        layout: 'standard',
        question: [[{ type: 'field', field: 'meaning', role: 'main' }], [{ type: 'field', field: 'example', role: 'sentence' }]],
        answer: [[{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'answer' }]],
        updatesLearned: 'category'
      },
      {
        id: 'meaning',
        label: '意味テスト',
        layout: 'standard',
        question: [[{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'main' }]],
        answer: [[{ type: 'field', field: 'meaning', role: 'answer' }]],
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
        [{ type: 'field', field: 'yomigana', role: 'sub' }],
        [{ type: 'field', field: 'word', role: 'main' }],
        [{ type: 'field', field: 'example', role: 'sentence' }]
      ],
      right: [
        [{ type: 'field', field: 'meaning', role: 'sentence' }]
      ]
    },
    tests: [
      {
        id: 'category',
        label: '三字熟語テスト',
        layout: 'standard',
        question: [[{ type: 'field', field: 'meaning', role: 'main' }], [{ type: 'field', field: 'example', role: 'sentence' }]],
        answer: [[{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'answer' }]],
        updatesLearned: 'category'
      },
      {
        id: 'meaning',
        label: '意味テスト',
        layout: 'standard',
        question: [[{ type: 'field', field: 'yomigana', role: 'sub' }, { type: 'field', field: 'word', role: 'main' }]],
        answer: [[{ type: 'field', field: 'meaning', role: 'answer' }]],
        updatesLearned: 'meaning'
      }
    ]
  },

  // ----------------------------------------------------------------
  // 3. 類義語・対義語 (Synonyms/Antonyms)
  // ----------------------------------------------------------------
  '類義語': {
    wordList: {
      layout: 'synonym',
      headerLabels: { left: '類義語左', right: '類義語右' },
      styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
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
        // sentence_fillモードでは「example」の「＿＿」が自動的に「word」に置換されるため、fieldsに「word」を含める必要はない
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
        // sentence_fillモードでは「example」の「＿＿」が自動的に「word」に置換されるため、fieldsに「word」を含める必要はない
        answer: [[{ type: 'group_members', mode: 'sentence_fill', fields: ['example_yomigana', 'example'], orderBy: 'none' }]],
        updatesLearned: 'category'
      }
    ]
  },

  // ----------------------------------------------------------------
  // 4. 同音異義語 (Homonyms)
  // ----------------------------------------------------------------
  '同音異義語': {
    wordList: {
      layout: 'homonym',
      // ...
    },
    tests: [
      {
        id: 'category',
        label: '同音異義語テスト',
        layout: 'homonym_fill',
        question: [[{ type: 'field', field: 'yomigana', role: 'main' }], [{ type: 'group_members', mode: 'homonym_fill', fields: ['example_yomigana', 'example'], orderBy: 'none' }]],
        // homonym_fillモード: 「example」内の「＿＿」を、正解時は正解単語（アンダーライン付き）に置換表示。
        // データには必ず「＿＿」が含まれる前提。
        answer: [[{ type: 'field', field: 'yomigana', role: 'main' }], [{ type: 'group_members', mode: 'homonym_fill', fields: ['example_yomigana', 'example', 'word'], orderBy: 'none' }]],
        updatesLearned: 'category'
      }
    ]
  },
    wordList: {
      layout: 'homonym',
      headerLabels: { left: 'よみがな', right: '同音異義語' },
      styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
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

  // ----------------------------------------------------------------
  // 5. ことわざグループ (Proverb Groups)
  // ----------------------------------------------------------------
  '似た意味のことわざ': {
    wordList: {
      layout: 'proverb_group',
      headerLabels: { left: '意味', right: 'ことわざ' },
      styles: { mainTextSize: 'base', mainTextWeight: 'normal' },
      groupMembers: {
        mode: 'proverb_group',
        fields: ['yomigana', 'word'],
        showCustomLabel: false,
        orderBy: 'none'
      }
    },
    tests: [
      {
        id: 'category',
        label: '似た意味のことわざテスト',
        layout: 'proverb_group',
        hideQuestionList: true,
        showGroupCountHint: true,
        question: [[{ type: 'field', field: 'meaning', role: 'main' }]],
        answer: [[{ type: 'group_members', mode: 'proverb_group', fields: ['yomigana', 'word'], showCustomLabel: false, orderBy: 'none' }]],
        updatesLearned: 'category'
      }
    ]
  },
  '対になることわざ': {
    wordList: {
      layout: 'proverb_group',
      headerLabels: { left: '意味', right: 'ことわざ' },
      styles: { mainTextSize: 'base', mainTextWeight: 'normal' },
      groupMembers: {
        mode: 'proverb_group',
        fields: ['yomigana', 'word'],
        showCustomLabel: true,
        orderBy: 'customLabel'
      }
    },
    tests: [
      {
        id: 'category',
        label: '対になることわざテスト',
        layout: 'proverb_group',
        hideQuestionList: true,
        showGroupCountHint: true,
        question: [[{ type: 'field', field: 'meaning', role: 'main' }]],
        answer: [[{ type: 'group_members', mode: 'proverb_group', fields: ['yomigana', 'word'], showCustomLabel: true, orderBy: 'customLabel' }]],
        updatesLearned: 'category'
      }
    ]
  },

  // ----------------------------------------------------------------
  // 6. ペア熟語 (Paired Idioms)
  // ----------------------------------------------------------------
  '上下で対となる熟語': {
    wordList: {
      layout: 'pair_sentence',
      headerLabels: { left: '熟語', right: '例文' },
      styles: { mainTextSize: 'lg', mainTextWeight: 'bold' },
      left: [
        [{ type: 'field', field: 'yomigana', role: 'sub' }],
        [{ type: 'field', field: 'word', role: 'main' }]
      ],
      right: [
        [{ type: 'field', field: 'example_yomigana', role: 'sub' }, { type: 'field', field: 'example', role: 'sentence' }]
      ]
    },
    tests: [
      {
        id: 'category',
        label: '熟語テスト',
        layout: 'pair_sentence',
        question: [[{ type: 'field', field: 'example_yomigana', role: 'sub' }, { type: 'field', field: 'example', role: 'main' }]],
        answer: [[{ type: 'field', field: 'example_yomigana', role: 'sub' }, { type: 'field', field: 'example', role: 'answer', transform: 'sentence_fill' }]],
        updatesLearned: 'category'
      }
    ]
  }
};
```

---

## 2. WordList 設計 (Design)

### 2.1 目的

- カテゴリ固有の表示分岐を排除し、設定から画面を構成する
- 表示される要素は全て編集可能とする
- 習得判定ロジックも設定に基づく形へ移行する

### 2.2 入力

- `scope.category`
- `CATEGORY_SETTINGS[category]`
- `words` (DBから取得したWord配列)

### 2.3 出力

- WordList UI（左/右列 + 編集 + 習得 + フィルタ）

### 2.4 レンダリング構成

#### 2.4.1 共通レンダラー

- `renderField(spec, ctx)`
- `renderFieldGroup(group, ctx)`
- `renderGroupMembers(spec, ctx)`

```ts
export type RenderCtx = {
  word: Word;
  editForm: EditFormState;
  isEditing: boolean;
  category: Category;
};
```

#### 2.4.2 レイアウト分岐

- `standard`: `left` と `right` を `FieldGroup` で描画
- `homonym`: 左は `yomigana`、右は `groupMembers`
- `synonym`: 左右ペアを `groupMembers` で描画
- `proverb_group`: 右は `groupMembers`、ラベル表示は `showCustomLabel` に従う
- `pair_sentence`: 左 `yomigana/word`、右 `exampleYomigana/example`

### 2.5 表示・編集ルール

- 表示されるものはすべて編集可能
- 非編集時は空値を表示しない（例文/よみがななど）
- `groupMembers` の並び順は `orderBy` に従う
  - `number`: `numberInPage` 昇順（CSV番号順）
  - `customLabel`: `customLabel` の順（上/下など）
- `showCustomLabel: true` の場合、ラベルは「上：」「下：」の形式で表示

### 2.6 習得判定・フィルタ

- `tests` に `updatesLearned: 'meaning'` が存在する場合
  - 習得済み = `isLearnedCategory && isLearnedMeaning`
- `updatesLearned: 'meaning'` が存在しない場合
  - 習得済み = `isLearnedCategory`

### 2.7 保存処理

- `FieldSpec` で表示された項目は、編集フォームに同期される
- `groupMembers` も同様に編集・保存対象とする

---

## 3. Test 設計 (Design)

### 3.1 目的

- カテゴリ固有の表示分岐を排除し、設定から画面を構成する
- テスト種別をカテゴリごとに定義し、柔軟に追加できるようにする

### 3.2 入力

- `scope.category`
- `CATEGORY_SETTINGS[category]`
- `type` (URL query param)
- `isFinalMode`

### 3.3 テスト選択

- URL の `type` を `TestConfig.id` に対応づける
- **一致するテストが存在しない場合はエラー表示**（フォールバック不可）

例:
```ts
const testId = searchParams.get('type');
const tests = CATEGORY_SETTINGS[category].tests;
const active = tests.find(t => t.id === testId);

if (!active) {
  return <div>不正なテスト種別です</div>;
}
```

### 3.4 レンダリング構成

#### 3.4.1 共通レンダラー

- `renderTestGroup(group, ctx)`
- `renderGroupMembers(spec, ctx)`

#### 3.4.2 レイアウト別描画

- `standard`: Question → Answer を通常表示
- `homonym_fill`: 例文の `＿＿` を穴埋め処理
- `synonym_list`: 左右ペア表示
- `proverb_group`: 出題時はリスト非表示 + 件数ヒント
- `pair_sentence`: 例文よみがな + 例文表示

### 3.5 学習フラグ更新

`TestConfig.updatesLearned` に従い更新する。

- `category`: `isLearnedCategory`
- `meaning`: `isLearnedMeaning`

### 3.6 表示スタイル

`FieldStyleRole` に基づいて表示を切り替える。

- `sub`: 小さめ表示
- `main`: 太字・大きめ表示
- `sentence`: 例文向け表示
- `answer`: 解答向け表示

---

## 4. CSVインポート仕様書 (Import Spec)

### 4.1 共通ルール

- CSVはヘッダー無しを想定する
- 1列目が数値でない場合は1行目をヘッダーとしてスキップする
- `page` と `numberInPage` が同じ行はグルーピングされ、`groupMembers` に格納される
- `position` (上/下など) は `customLabel` として保持し、表示に使用する
- `word` / `yomigana` / `meaning` / `example` / `exampleYomigana` はDB列にそのまま入れる
- `undefined` を明記するのは「その列は意図的に使わない/取り込まない」ことの明示であり、
  特に混同しやすいカテゴリ（例: ことわざグループ）でのみ記載する
- 複数CSVの取り込みに対応する
  - ファイル選択時の確認ダイアログは**1回のみ**
  - 取り込みは**選択順**に順次実行する
  - 途中で失敗した場合は**中断**し、以降のファイルは取り込まない

### 4.2 カテゴリ別レイアウトと取り込み

#### 4.2.1 ことわざ
- CSV列: `page, number, word, yomigana, meaning`
- 取り込み:
  - `rawWord = word`
  - `yomigana = yomigana`
  - `rawMeaning = meaning`

#### 4.2.2 慣用句 / 四字熟語 / 三字熟語
- CSV列: `page, number, example, word, yomigana, meaning`
- 取り込み:
  - `rawWord = word`
  - `yomigana = yomigana`
  - `rawMeaning = meaning`
  - `exampleSentence = example`

#### 4.2.3 類義語 / 対義語
- CSV列: `page, number, wordA, yomiA, sentenceA, sentenceYomiA, wordB, yomiB, sentenceB, sentenceYomiB`
- 取り込み:
  - `rawWord = wordA/wordB`
  - `yomigana = yomiA/yomiB`
  - `exampleSentence = sentenceA/sentenceB`
  - `exampleSentenceYomigana = sentenceYomiA/sentenceYomiB`
  - `groupMembers` に2件を格納

#### 4.2.4 同音異義語 / 同訓異字
- CSV列: `page, number, yomigana, word, example, exampleYomigana`
- 取り込み:
  - `rawWord = word`
  - `yomigana = yomigana`
  - `exampleSentence = example`
  - `exampleSentenceYomigana = exampleYomigana`
  - `groupMembers` に同じ `page/number` の複数行をまとめる

※ `rawMeaning = example` の互換ロジックは不要。削除対象。

#### 4.2.5 似た意味のことわざ
- CSV列: `page, number, word, yomigana, meaning`
- 取り込み:
  - `rawWord = word` (ことわざ)
  - `yomigana = yomigana` (右列のよみがなとして使う)
  - `rawMeaning = meaning` (左列の意味表示に使う)
  - `exampleSentence = undefined` (使わない)
  - `exampleSentenceYomigana = undefined` (使わない)
  - `customLabel = undefined`
  - `groupMembers` に同じ `page/number` の複数行をまとめる

#### 4.2.6 対になることわざ
- CSV列: `page, number, position, word, yomigana, meaning`
- 取り込み:
  - `rawWord = word` (ことわざ)
  - `yomigana = yomigana` (右列のよみがなとして使う)
  - `rawMeaning = meaning` (左列の意味表示に使う)
  - `exampleSentence = undefined` (使わない)
  - `exampleSentenceYomigana = undefined` (使わない)
  - `customLabel = position` (上/下)
  - `groupMembers` に同じ `page/number` の複数行をまとめる

#### 4.2.7 上下で対となる熟語
- CSV列: `page, number, word, yomigana, example, exampleYomigana`
- 取り込み:
  - `rawWord = word`
  - `yomigana = yomigana`
  - `rawMeaning = undefined` (使わない)
  - `exampleSentence = example`
  - `exampleSentenceYomigana = exampleYomigana`
  - `customLabel = undefined`

### 4.3 今後の修正方針

- 既存の `ProverbGroupImporter` は `customLabel` を保存していないため修正が必要
- `PairedIdiomImporter` は意味列と例文列の扱いが現仕様と異なるため、この仕様に合わせて修正
- すべてのインポーターは本仕様書をソース・オブ・トゥルースとして調整する
