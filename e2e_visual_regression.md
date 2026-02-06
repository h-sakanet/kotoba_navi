# Playwright + Visual Regression

## 目的
- `WordList` のカテゴリ別表示をスクリーンショット比較で回帰検知します。
- マスク `OFF` と `ON` の両状態を比較対象にします（トグルがあるカテゴリのみ）。

## 構成
- 設定: `playwright.config.ts`
- テスト本体: `/Users/sakanet/kotoba_navi/e2e/visual-wordlist.spec.ts`
- seedヘルパー: `/Users/sakanet/kotoba_navi/e2e/helpers/dbSeed.ts`
- seedデータ: `/Users/sakanet/kotoba_navi/e2e/fixtures/wordListVisualCases.ts`
- seed専用ページ: `/Users/sakanet/kotoba_navi/public/e2e-seed.html`

## 実行
1. ブラウザをインストール
```bash
npm run test:e2e:install
```

2. 初回ベースライン作成（または意図的UI変更時）
```bash
npm run test:e2e:baseline
```

3. 通常の回帰確認（差分があれば `test-results` にdiff画像を生成）
```bash
npm run test:e2e
```

4. 回帰確認 + 差分画像の自動収集（推奨）
```bash
npm run test:e2e:check
```

5. レポート確認（任意）
```bash
npx playwright show-report
```

## 差分抽出ワークフロー
1. 仕様変更を反映して基準更新
```bash
npm run test:e2e:baseline
```
2. 以降の変更ごとに差分チェック
```bash
npm run test:e2e:check
```
3. 差分がある場合は `test-results` から画像が `.artifacts/visual-diff/<timestamp>/` にコピーされます
4. 生成済み `test-results` から再抽出したい時は以下を実行
```bash
npm run test:e2e:diff
```

## 新カテゴリ追加時
1. `e2e/fixtures/wordListVisualCases.ts` に `scopeId` と seed データを1件追加
2. `npm run test:e2e:baseline` で新カテゴリのスナップショットを生成
3. `npm run test:e2e:check` で差分なしを確認

## テストケース定義の場所
- シナリオ定義: `/Users/sakanet/kotoba_navi/e2e/visual-wordlist.spec.ts`
- ケースデータ定義: `/Users/sakanet/kotoba_navi/e2e/fixtures/wordListVisualCases.ts`
- DB seed: `/Users/sakanet/kotoba_navi/e2e/helpers/dbSeed.ts`

## E2E spec一覧
- 見て覚えるモードのVisual比較: `/Users/sakanet/kotoba_navi/e2e/visual-wordlist.spec.ts`
- 見て覚えるモードの編集反映: `/Users/sakanet/kotoba_navi/e2e/wordlist-edit.spec.ts`
- テストモードの出題/回答/完了: `/Users/sakanet/kotoba_navi/e2e/test-mode.spec.ts`
