# Test 設計 (Design)

この設計は `config_design.md` を前提に、`Test.tsx` を設定駆動で描画するための仕様です。

## 1. 目的

- カテゴリ固有の表示分岐を排除し、設定から画面を構成する
- テスト種別をカテゴリごとに定義し、柔軟に追加できるようにする

## 2. 入力

- `scope.category`
- `CATEGORY_SETTINGS[category]`
- `type` (URL query param)
- `isFinalMode`

## 3. テスト選択

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

## 4. レンダリング構成

### 4.1 共通レンダラー

- `renderTestGroup(group, ctx)`
- `renderGroupMembers(spec, ctx)`

### 4.2 レイアウト別描画

- `standard`: Question → Answer を通常表示
- `homonym_fill`: 例文の `＿＿` を穴埋め処理
- `synonym_list`: 左右ペア表示
- `proverb_group`: 出題時はリスト非表示 + 件数ヒント
- `pair_sentence`: 例文よみがな + 例文表示

## 5. 学習フラグ更新

`TestConfig.updatesLearned` に従い更新する。

- `category`: `isLearnedCategory`
- `meaning`: `isLearnedMeaning`

## 6. 表示スタイル

`FieldStyleRole` に基づいて表示を切り替える。

- `sub`: 小さめ表示
- `main`: 太字・大きめ表示
- `sentence`: 例文向け表示
- `answer`: 解答向け表示

