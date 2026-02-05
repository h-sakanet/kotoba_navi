# CSVインポート仕様書 (Import Spec)

このドキュメントは、CSVの列レイアウトと、DBテーブルへの取り込み規則を明文化するものです。
現在の実装はインポーターが複数に分かれており複雑化しているため、今後はこの仕様に沿って
インポート処理を整理・修正します。

## 1. 共通ルール

- CSVはヘッダー無しを想定する
- 1列目が数値でない場合は1行目をヘッダーとしてスキップする
- `page` と `numberInPage` が同じ行はグルーピングされ、`groupMembers` に格納される
- `position` (上/下など) は `customLabel` として保持し、表示に使用する
- `word` / `yomigana` / `meaning` / `example` / `exampleYomigana` はDB列にそのまま入れる
- `undefined` を明記するのは「その列は意図的に使わない/取り込まない」ことの明示であり、
  特に混同しやすいカテゴリ（例: ことわざグループ）でのみ記載する

## 2. カテゴリ別レイアウトと取り込み

### 2.1 ことわざ
- CSV列: `page, number, word, yomigana, meaning`
- 取り込み:
  - `rawWord = word`
  - `yomigana = yomigana`
  - `rawMeaning = meaning`

### 2.2 慣用句 / 四字熟語 / 三字熟語
- CSV列: `page, number, example, word, yomigana, meaning`
- 取り込み:
  - `rawWord = word`
  - `yomigana = yomigana`
  - `rawMeaning = meaning`
  - `exampleSentence = example`

### 2.3 類義語 / 対義語
- CSV列: `page, number, wordA, yomiganaA, exampleA, exampleYomiganaA, wordB, yomiganaB, exampleB, exampleYomiganaB`
- 取り込み:
  - `rawWord = wordA/wordB`
  - `yomigana = yomiganaA/yomiganaB`
  - `exampleSentence = exampleA/exampleB`
  - `exampleSentenceYomigana = exampleYomiganaA/exampleYomiganaB`
  - `groupMembers` に2件を格納

### 2.4 同音異義語 / 同訓異字
- CSV列: `page, number, yomigana, word, example, exampleYomigana`
- 取り込み:
  - `rawWord = word`
  - `yomigana = yomigana`
  - `exampleSentence = example`
  - `exampleSentenceYomigana = exampleYomigana`
  - `groupMembers` に同じ `page/number` の複数行をまとめる

※ `rawMeaning = example` の互換ロジックは不要。削除対象。

### 2.5 似た意味のことわざ
- CSV列: `page, number, word, yomigana, meaning`
- 取り込み:
  - `rawWord = word` (ことわざ)
  - `yomigana = yomigana` (右列のよみがなとして使う)
  - `rawMeaning = meaning` (左列の意味表示に使う)
  - `exampleSentence = undefined` (使わない)
  - `exampleSentenceYomigana = undefined` (使わない)
  - `customLabel = undefined`
  - `groupMembers` に同じ `page/number` の複数行をまとめる

### 2.6 対になることわざ
- CSV列: `page, number, position, word, yomigana, meaning`
- 取り込み:
  - `rawWord = word` (ことわざ)
  - `yomigana = yomigana` (右列のよみがなとして使う)
  - `rawMeaning = meaning` (左列の意味表示に使う)
  - `exampleSentence = undefined` (使わない)
  - `exampleSentenceYomigana = undefined` (使わない)
  - `customLabel = position` (上/下)
  - `groupMembers` に同じ `page/number` の複数行をまとめる

### 2.7 上下で対となる熟語
- CSV列: `page, number, word, yomigana, example, exampleYomigana`
- 取り込み:
  - `rawWord = word`
  - `yomigana = yomigana`
  - `rawMeaning = undefined` (使わない)
  - `exampleSentence = example`
  - `exampleSentenceYomigana = exampleYomigana`
  - `customLabel = undefined`

## 3. 今後の修正方針

- 既存の `ProverbGroupImporter` は `customLabel` を保存していないため修正が必要
- `PairedIdiomImporter` は意味列と例文列の扱いが現仕様と異なるため、この仕様に合わせて修正
- すべてのインポーターは本仕様書をソース・オブ・トゥルースとして調整する
