# WordList 設計 (Design)

この設計は `config_design.md` を前提に、`WordList.tsx` を設定駆動で描画するための仕様です。

## 1. 目的

- カテゴリ固有の表示分岐を排除し、設定から画面を構成する
- 表示される要素は全て編集可能とする
- 習得判定ロジックも設定に基づく形へ移行する

## 2. 入力

- `scope.category`
- `CATEGORY_SETTINGS[category]`
- `words` (DBから取得したWord配列)

## 3. 出力

- WordList UI（左/右列 + 編集 + 習得 + フィルタ）

## 4. レンダリング構成

### 4.1 共通レンダラー

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

### 4.2 レイアウト分岐

- `standard`: `left` と `right` を `FieldGroup` で描画
- `homonym`: 左は `yomigana`、右は `groupMembers`
- `synonym`: 左右ペアを `groupMembers` で描画
- `proverb_group`: 右は `groupMembers`、ラベル表示は `showCustomLabel` に従う
- `pair_sentence`: 左 `yomigana/word`、右 `exampleYomigana/example`

## 5. 表示・編集ルール

- 表示されるものはすべて編集可能
- 非編集時は空値を表示しない（例文/よみがななど）
- `groupMembers` の並び順は `orderBy` に従う
  - `number`: `numberInPage` 昇順（CSV番号順）
  - `customLabel`: `customLabel` の順（上/下など）
- `showCustomLabel: true` の場合、ラベルは「上：」「下：」の形式で表示

## 6. 習得判定・フィルタ

- `tests` に `updatesLearned: 'meaning'` が存在する場合
  - 習得済み = `isLearnedCategory && isLearnedMeaning`
- `updatesLearned: 'meaning'` が存在しない場合
  - 習得済み = `isLearnedCategory`

## 7. 保存処理

- `FieldSpec` で表示された項目は、編集フォームに同期される
- `groupMembers` も同様に編集・保存対象とする

