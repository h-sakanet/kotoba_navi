---
description: Define and clarify requirements before implementation
---

# Requirement Definition Workflow

This workflow guides the process of clarifying user requirements, eliminating ambiguities, and formalizing them into a structured Requirement Definition Document (`requirements_definition.md`) BEFORE any code implementation begins.

## Goal
To produce a detailed and mutually agreed-upon `requirements_definition.md` that serves as the single source of truth for the implementation.

## Steps

### 1. Initial Requirement Gathering
- **Action**: Ask the user to describe the feature or change they want to implement.
- **Output**: Raw user input.

### 2. Draft Requirement Definition
- **Action**: Create (or update) `requirements_definition.md` using the template below. Fill in known information based on user input.
- **Rules**:
  - **Language**: All communication and the resulting `requirements_definition.md` must be written in **Japanese**.
  - Do not guess ambiguous details. Mark them as `[Pending]` or `[Question]`.
  - Use clear, non-technical language where possible to ensure alignment with the user's intent.

#### Template (`requirements_definition.md`)
```markdown
# Requirement Definition: [Feature Name]

## 1. Objective & Background
*   **Goal**: What is the primary purpose of this feature?
*   **Problem**: What issue does this solve?
*   **Background**: Why is this needed now?

## 2. Functional Requirements
*   **Core Logic**: 
    *   [ ] Requirement 1
    *   [ ] Requirement 2
*   **User Interface (UI)**:
    *   [ ] Screen Layout
    *   [ ] User Interactions
*   **Data Handling**:
    *   [ ] Input Format (CSV, etc.)
    *   [ ] Data Storage (DB Schema)
    *   [ ] Import/Export Logic

## 3. Non-Functional Requirements & Constraints
*   **Performance**:
*   **Security**:
*   **Compatibility**: (e.g., Mobile, Desktop)
*   **Constraints**: (e.g., "Must not affect existing Proverb data")

## 4. Edge Cases & Error Handling
*   [ ] Case A (e.g., Empty Input)
*   [ ] Case B (e.g., Duplicate Data)

## 5. Pending Questions (The "Interrogation" List)
*   [ ] Q1: ...
*   [ ] Q2: ...
```

### 3. The Interrogation Phase (Ambiguity Elimination)
- **Action**: Review the draft and identify **Active Ambiguities**.
- **Action**: Ask the user specific, probing questions to clarify these points.
  - *Example*: "You mentioned 'displaying the list', but do you want it sorted? If so, by what key?"
  - *Example*: "What should happen if the CSV contains a duplicate ID? Overwrite or Skip?"
  - *Example*: "Is this change global or local to this specific screen?"
- **Rule**: Do NOT proceed until the `Pending Questions` section is cleared.

### 4. 受入テストのドラフト作成 (Draft Acceptance Tests - TDD)
- **概念**: 要件定義の段階で、その要件を満たすかどうかを判定する「テストコード」を先に書きます。
- **アクション**: 新機能や変更に対する **「失敗するテスト（Failing Test）」** を `*.spec.ts` または `*.test.ts` として作成します。
  - プロダクトコードの実装前なので、このテストは実行すると必ず失敗（またはコンパイルエラー）になります。
  - テストコード自体が「実行可能な仕様書」としての役割を果たします。
- **内容**:
  - 正常系（期待される入出力）
  - 異常系（エラーになるべき入力）

### 5. 最終レビューと承認 (Final Review & Approval)
- **アクション**: 完成した `requirements_definition.md` と `ドラフトテストコード` をユーザーに提示します。
- **アクション**: 明示的な承認を求めます。
- **アクション**: 承認されたら、このテストを Pass させることをゴールとして `implementation_plan.md`（実装計画）の作成に進みます。却下された場合は、ステップ3に戻ります。
