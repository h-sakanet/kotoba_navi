# 要件定義: カテゴリ表示設定のリファクタリング

## 1. 目的と背景
*   **目的**: `WordList.tsx` と `Test.tsx` からカテゴリ固有の表示ロジックを分離し、一元管理された設定オブジェクト（コンフィグ）に移行する。
*   **問題**: 現状、新しいカテゴリの追加や表示要件の変更を行う際、複数のファイルに散らばる複雑な条件分岐（例: `if (isHomonym) ...`）を修正する必要がある。
*   **背景**: 今後も表示要件の変更や新規カテゴリの追加が頻繁に発生すると予想されるため、設定ベースのアプローチに変更することで、変更を容易かつ安全に行えるようにしたい。

## 2. 機能要件
*   **コアロジック**:
    *   [ ] `WordList` と `Test` の振る舞いを定義する一元管理された設定マップ（キー: `Category`, 値: `CategoryConfig`）を作成する。
    *   [ ] コンポーネント内の `isHomonymCategory`, `isSynonymCategory` 等のハードコード条件分岐を削除する。
    *   [ ] テスト種別（「カテゴリテスト」「意味テスト」）の概念を汎用化し、カテゴリごとに「利用可能なテストのリスト」を設定で定義できるようにする。
*   **ユーザーインターフェース (UI)**:
    *   [ ] `WordList.tsx`: アクティブなカテゴリの設定に基づいて、ヘッダー、列、入力フィールドを描画する。
    *   [ ] `Test.tsx`: 設定で定義されたテストタイプ（出題元、正解元、表示形式）に基づいて画面を描画する。
*   **データ処理**:
    *   [ ] データベースのスキーマ変更は行わない。
    *   [ ] 既存のデータ（特に同音異義語のような複雑なタイプ）が、新しい設定下でも正しく表示されることを保証する。

## 3. 非機能要件と制約
*   **保守性**: 設定構造は直感的であること。
*   **回帰テスト**: 既存のカテゴリは、リファクタリング後も現在と全く同じ挙動をする必要がある。

## 4. 提案する設定構造（改定版）
```typescript
type FieldType = 'word' | 'meaning' | 'yomigana' | 'example' | 'group_members_list';

interface TestConfig {
  id: string;             // URLパラメータ用 (例: 'category', 'meaning')
  label: string;          // 表示名 (例: 'ことわざテスト', '意味テスト')
  questionField: FieldType; // 問題として表示するデータ
  answerField: FieldType;   // 正解として表示するデータ
  displayLayout: 'standard' | 'homonym_list'; // 表示レイアウト
}

interface CategorySettings {
  // 単語リスト（一覧）画面の設定
  wordList: {
    layoutType: 'standard' | 'homonym' | 'synonym' | 'pair_sentence';
    headerLabels: {
      left: string;
      right: string;
    };
    showLeftSentence: boolean;
    showRightColumnSentence: boolean;
  };
  
  // 利用可能なテスト設定のリスト
  tests: TestConfig[];
  
  // 機能フラグ（必要に応じて残すが、testsで代替できるものは削除）
  features: {
    enableSentenceEdit: boolean;
  };
}
```

## 5. 決定事項 (Resolved)
*   **例外カテゴリなし**: 類義語・同音異義語も含め、すべて設定ベースのアプローチで対応する。
*   **テストの汎用化**: 「カテゴリテスト」「意味テスト」という固定概念を廃止し、カテゴリごとにテスト定義を持たせる。
    *   例（ことわざ）:
        1.  ID: `category` (ことわざテスト), Q: `meaning`, A: `word` (読み+言葉), Layout: `standard`
        2.  ID: `meaning` (意味テスト), Q: `word`, A: `meaning`, Layout: `standard`
