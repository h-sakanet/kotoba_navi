# カテゴリ・単元追加ガイド

このドキュメントは、今後 `言葉ナビ` に新しいカテゴリや単元（= scope）を追加する際の作業手順をまとめたものです。  
現行実装では、カテゴリ追加の入口は主に以下です。

1. `src/utils/categoryConfig.ts`（カテゴリ設定の正本）
2. `src/data/scope.ts`（単元・ページ範囲の定義）

`csvImporter.ts` にカテゴリ別 `switch` を追加する必要はありません（設定参照方式に移行済み）。

---

## 1. 単元だけ追加する場合（既存カテゴリ）

対象: 既存カテゴリに新しい範囲（例: `42A-40`）を追加するだけのケース

1. `src/data/scope.ts` の `SCOPE_RANGES_BY_CATEGORY` に範囲を追加する
2. 必要なら `displayId` を指定する（複数 scope を同一表示IDで束ねたい場合）
3. テストを実行して整合性確認

このケースでは通常、`categoryConfig.ts` の編集は不要です。

---

## 2. 新しいカテゴリを追加する場合（既存CSV形式で対応可能）

### 2-1. 型を追加
1. `src/types.ts` の `Category` union に新カテゴリ名を追加する

### 2-2. カテゴリ設定を追加（最重要）
1. `src/utils/categoryConfig.ts` の `CATEGORY_SETTINGS` に新カテゴリを追加する
2. 以下を必ず定義する（明示必須）
   - `importerKind`
   - `learningDashboard.titleSource`
   - `wordList`（`layout`, `headerLabels`, `styles`, `editBehavior`, `left/right` など）
   - `tests`（各 `TestConfig` に `retryUnlockSide` を必ず設定）

### 2-2-1. 明示必須ルール（重要）
1. `tests[].retryUnlockSide` は必須です（`left` / `right`）。
2. `wordList.editBehavior.syncParentYomiganaToGroupMembers` は必須です。
3. `learningDashboard.titleSource` は必須です（`left` / `right` / `left_right_pair`）。
4. 「meaningならright」のような暗黙フォールバックを前提にしないでください。  
   すべて `CATEGORY_SETTINGS` に明示します。

### 2-3. 単元を追加
1. `src/data/scope.ts` の `SCOPE_RANGES_BY_CATEGORY` に新カテゴリの範囲を追加する

### 2-4. 確認
1. `npm run build`
2. `npm test -- --run src/utils/categoryConsistency.spec.ts`
3. 可能なら `npm test -- --run` を全体実行

---

## 3. 新しいカテゴリを追加する場合（新CSV形式が必要）

上記「2」に加えて、以下を実施します。

1. `src/utils/importers/` に新しい importer を追加（`ImportStrategy` 実装）
2. `src/utils/categoryConfig.ts` の `ImporterKind` union に新 kind を追加
3. `src/utils/importers/importerRegistry.ts` に登録
   - `IMPORTER_BY_KIND` へ追加
   - 必要なら `FALLBACK_IMPORTERS` の順序調整
4. 新カテゴリの `importerKind` を `CATEGORY_SETTINGS` 側で指定

---

## 4. 実装後チェックリスト

1. 追加カテゴリの scope が Home 画面に表示される
2. ModeModal でカテゴリ名・テスト導線が正しい
3. WordList のヘッダ・左右表示・マスク挙動が仕様通り
4. Test 画面の出題/解答表示が `tests` 定義通り（`retryUnlockSide` 含む）
5. CSV取込でカテゴリ判定が意図どおり（ページ範囲ベース）
6. 学習ダッシュボードで左右表示とタイトルが `learningDashboard` / `wordList.headerLabels` と一致する
7. build/test が通る

---

## 5. 変更時に触る可能性があるファイル一覧

### 必須（ほぼ毎回）
1. `src/data/scope.ts`
2. `src/utils/categoryConfig.ts`（新カテゴリ時）
3. `src/types.ts`（新カテゴリ時）

### 新CSV形式時のみ
1. `src/utils/importers/ImportStrategy.ts`（interface参照）
2. `src/utils/importers/<NewImporter>.ts`
3. `src/utils/importers/importerRegistry.ts`

### 参照・検証
1. `src/utils/csvImporter.ts`（通常は変更不要）
2. `src/utils/categoryConsistency.spec.ts`

---

## 6. 補足（設計意図）

カテゴリの表示・テスト・取込戦略は `CATEGORY_SETTINGS` に寄せています。  
scope は「どのページがどのカテゴリか」を定義する責務だけに絞り、取込ロジックは `importerKind` を参照して動作します。  
このため、カテゴリ追加時の修正漏れを減らし、継続運用しやすい構成になっています。
