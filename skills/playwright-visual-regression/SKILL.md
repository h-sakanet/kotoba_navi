---
name: playwright-visual-regression
description: Set up and operate Playwright visual regression workflows for web apps. Use when a project needs screenshot baseline creation, regular diff checks, failure triage, and repeatable local/CI execution with clear output artifacts.
---

# Playwright Visual Regression

Standardize Playwright visual regression operation from first setup to ongoing checks.
Produce stable `baseline -> check -> diff triage` loops with deterministic data and explicit artifact paths.

## Coverage

This skill is designed to cover these recurring project stages:
- Initial rollout: install Playwright, scaffold commands, run first baseline, troubleshoot startup issues.
- Regular loop: run checks, inspect diffs, report pass/fail and duration.
- Feature rollout: add or update cases, refresh baseline intentionally, run full regression for non-targeted breakage.

## Workflow

1. Verify test runner and command surface.
- Inspect `package.json` scripts and existing Playwright config.
- Prefer these commands if present: `test:e2e:install`, `test:e2e:baseline`, `test:e2e:check`, `test:e2e:diff`.

2. Ensure deterministic test data.
- Seed local DB or API mocks before each case.
- Remove randomness from assertions or lock data to one candidate when random ordering exists.

3. Generate baseline snapshots.
- Run `npm run test:e2e:baseline`.
- Confirm snapshot directories exist under `e2e/*.spec.ts-snapshots`.
- Do not treat baseline update as pass/fail quality signal. It is a golden-image update step.

4. Run regression check.
- Run `npm run test:e2e:check`.
- Capture elapsed time and pass/fail counts for operational cost tracking.
- Report where results are stored (`playwright-report`, `test-results`, optional `.artifacts`).

5. Triage failures before changing baselines.
- First classify: test bug, selector fragility, data nondeterminism, intentional UI change.
- Only after classification, update snapshots intentionally.

6. Emit concise operation summary.
- Include command list, total duration, pass/fail counts, snapshot count changes, and diff artifact paths.

## Initial Project Setup Checklist

1. Install dependencies and browser binaries.
- Add `@playwright/test` and browser install script.
- Run browser install once per environment.

2. Create standard command surface.
- Ensure scripts exist for:
  - install: browser setup
  - baseline: snapshot update run
  - check: normal regression run
  - diff: artifact export from failed runs

3. Add config and deterministic test harness.
- Add `playwright.config.ts` with stable viewport and web server settings.
- Add deterministic seed path for local DB or API mock.
- Add initial spec files with explicit naming of snapshot states.

4. Validate bootstrap.
- Run a small subset first.
- Then run full baseline and full check.
- Capture elapsed seconds for both to establish expected local runtime.

## Baseline Policy

- Update baseline when UI change is intentional and accepted.
- Do not update baseline to mask flaky tests.
- Keep one clear commit scope: behavior fix vs baseline refresh.

## Failure Handling

- If check fails, inspect:
  - `test-results/<test-id>/error-context.md`
  - `test-results/<test-id>/test-failed-1.png`
  - `playwright-report/index.html`
- If check passes with no diffs, expect:
  - console summary with passed count
  - `No visual diff images found.` when diff export script is enabled

## Troubleshooting Decision Tree

1. Runner cannot start web server.
- Check port conflict and host binding.
- Ensure command matches local dev server and sandbox permissions.

2. Tests fail before screenshot assertion.
- Treat as behavior/assertion issue first.
- Fix selector instability, waiting condition, or seed assumptions.

3. Screenshot mismatch with otherwise healthy flow.
- Confirm whether UI changed intentionally.
- Intentional change: refresh baseline.
- Unintentional change: fix app code, rerun check.

4. Random or flaky failures.
- Remove random candidate sets from scenario when stable ordering is required.
- Use deterministic seed with minimum data to satisfy scenario.

5. Slow runs.
- Split smoke vs full suites.
- Keep full-suite check for release gates.

## PR and Review Policy

1. Separate commits by intent.
- Commit A: test or app behavior fixes.
- Commit B: baseline image updates.

2. Require evidence in PR notes.
- Command outputs (`baseline`, `check`) with duration.
- Snapshot count changes.
- Diff artifact path when failures occurred.

3. Block risky merges.
- Reject baseline-only refresh if root cause classification is missing.

## References

- Detailed runbook and reporting template: `references/workflow.md`
