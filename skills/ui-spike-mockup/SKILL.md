---
name: ui-spike-mockup
description: Create quick UI-only preview routes before implementing business logic. Use when layout, labels, spacing, or control placement must be validated quickly with one or more mock variants.
---

# UI Spike Mockup

UIを先に固め、ロジック実装の手戻りを減らすための手順です。

## Use This Skill When

- ユーザーが「UIだけ先に確認したい」と言う
- ボタン位置、ラベル、余白、見た目の比較を短時間で行いたい
- A/B/C案を同時に見比べたい

## Workflow

1. スコープを固定する
- 対象画面、比較したい要素、案数（A/B/C）を確認する。
- 今回のスパイクは「見た目のみ」か「簡易操作あり」かを決める。

2. 既存画面がある場合は忠実再現を優先する
- 既存ページのレイアウト構造（ヘッダー高さ、テーブル列幅、余白、タイポ）を流用する。
- 独立モックを先に作るのではなく、既存画面に差分だけ当てる形を優先する。
- 比較対象のUI差分以外は変更しない。

3. UI専用プレビュールートを作る
- ルートは `/ui-preview/<screen>-a` の形式にする。
- 複数案は `/ui-preview/<screen>-b`, `/ui-preview/<screen>-c` を追加する。
- 既存コンポーネントと既存スタイルを最優先で流用する。

4. スパイク実装の制約を守る
- DB更新、API呼び出し、本番状態管理を入れない。
- ダミーデータで見た目だけ再現する。
- 本番ロジック変更は行わない。

5. ユーザーへの提示を固定化する
- URLを列挙して返す（dev serverの確認・起動は行わない）。
- 各案の差分を3行以内で説明する。
- 「次の修正ポイント」を1つだけ提案する。

6. 確定後に本実装へ移る
- ユーザーがUI確定したら本番コードに反映する。
- 不要な `/ui-preview` ルートは削除する（またはユーザー指示で維持）。

## Output Format

必ず次の形式で返す:

1. Preview URLs
- A: `http://localhost:5173/ui-preview/...`
- B: `http://localhost:5173/ui-preview/...`
- C: `http://localhost:5173/ui-preview/...`

2. Differences
- A: ...
- B: ...
- C: ...

3. Recommended Next Step
- ...
