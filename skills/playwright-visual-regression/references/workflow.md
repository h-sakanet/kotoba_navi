# Playwright Visual Regression Runbook

## Standard Loop

1. Install browser once per environment.
```bash
npm run test:e2e:install
```

2. Create or refresh baseline snapshots.
```bash
npm run test:e2e:baseline
```

3. Run regression check.
```bash
npm run test:e2e:check
```

4. Re-export visual diff artifacts from the latest `test-results` when needed.
```bash
npm run test:e2e:diff
```

## First-Time Project Bootstrap

1. Add Playwright dependency and scripts to `package.json`.
2. Create `playwright.config.ts` with:
- stable viewport
- deterministic web server port
- CI-friendly retries/workers
3. Add deterministic seed helper and minimal fixtures.
4. Add one visual spec and one functional spec.
5. Run:
```bash
npm run test:e2e:install
npm run test:e2e:baseline
npm run test:e2e:check
```
6. Record baseline runtime and check runtime as operational budget.

## Report Template

- Scope: which specs/cases were run
- Duration: baseline sec / check sec / total sec
- Result: pass count, fail count
- Snapshot count:
  - visual spec snapshots
  - test-mode snapshots
- Diff artifacts:
  - `.artifacts/visual-diff/<timestamp>/`
  - `playwright-report/index.html`
  - `test-results/.../error-context.md`
- Classification:
  - test bug / data issue / intentional UI change / regression

## Triage Decision Tree

1. If assertion failed before screenshot comparison:
- Fix selector or test precondition.
- Re-run check before baseline update.

2. If screenshot mismatch happened:
- Confirm whether UI change is intentional.
- Intentional: update baseline.
- Unintentional: fix product code, then re-run check.

3. If tests are flaky:
- Remove random data dependencies.
- Stabilize viewport, seed data, and waiting condition.

## Feature-Addition Loop

1. Add or update E2E cases for changed feature.
2. Run targeted spec to stabilize quickly.
3. Refresh baseline.
4. Run full check to catch unrelated regressions.
5. Report scope and outcomes with artifact paths.
