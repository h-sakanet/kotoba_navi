---
name: Automatic Test Generation
description: Automatically generate and execute test codes based on specifications and code.
---

# 自動テスト生成・実行スキル (Automated Test Gen & TDD Skill)

このスキルは、新規機能開発やバグ修正において「まずテストを書き、それをパスさせる」という**TDD（テスト駆動開発）アプローチ**を支援するものです。
また、要件定義フェーズで作成された「受入テスト（ドラフト）」を実装フェーズで活用し、品質を保証します。

## ユースケース (Use Cases)
- **TDDサイクル（Red-Green-Refactor）**: 実装前にテストを書き、実装をガイドする。
- **仕様の実行可能化**: `requirements_definition.md` で定義された仕様をコードとして表現する。
- **リグレッション防止**: 既存機能の挙動を変えずにリファクタリングを行う。

## プロセス (Process)

### 1. 環境チェック (Environment Check)
- **アクション**: プロジェクト指定のテストランナーである **Vitest** がインストールされているか確認する。
- **コマンド**: `npm list vitest` または `package.json` の `devDependencies` を確認。
- **未導入の場合**: インストールを提案・実行する。

### 2. テストの作成・取り込み (Create / Adopt Tests)
**【パターンA：要件定義からの引継ぎ】**
- **インプット**: Workflowで作成された `*.spec.ts`（ドラフトテスト）。
- **アクション**: このファイルをテストディレクトリ（`src/__tests__` など）に配置し、インポートパスなどを整えて実行可能な状態にする。

**【パターンB：新規作成】**
- **インプット**: `requirements_definition.md` とソースコード。
- **アクション**: 以下の観点でテストケースを作成する。
  - **Happy Path（正常系）**
  - **Edge Cases（境界値）**
  - **Error Cases（異常系）**

### 3. TDDサイクルの実行 (Execute TDD Cycle)

1.  **Red (失敗の確認)**:
    - テストを実行し、**「予想通りに失敗すること」**を確認する。
    - コンパイルエラーが出る場合は、最低限の型定義や空の関数を作成してコンパイルを通す。
    - コマンド: `npx vitest run [ファイル名]`

2.  **Green (成功させる)**:
    - テストをパスさせるためだけの**最低限の実装**を行う。
    - 綺麗なコードでなくても良い（まずは動くことが最優先）。
    - コマンド: `npx vitest run [ファイル名]` -> Passすることを確認。

3.  **Refactor (整理する)**:
    - 重複の排除、可読性の向上、構造の最適化を行う。
    - 修正後もテストがPassし続けていることを確認する。

### 4. レポート (Reporting)
- 最終的なテスト実行結果と、実装したコードの概要を報告する。

