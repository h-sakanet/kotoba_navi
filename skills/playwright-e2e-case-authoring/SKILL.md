---
name: playwright-e2e-case-authoring
description: Design and add robust Playwright E2E scenarios with deterministic test data, stable selectors, and maintainable assertions. Use when adding new screens, user operations, or regression cases that must remain stable across repeated runs.
---

# Playwright E2e Case Authoring

Create E2E cases that survive UI iteration without becoming flaky.
Separate visual assertions from behavior assertions to keep intent and failure diagnosis clear.

## Workflow

1. Define target behavior first.
- Write explicit expected behavior for each scenario.
- Split into:
  - Visual scenario (screenshot diff)
  - Functional scenario (state/data persistence)

2. Design deterministic seed data.
- Seed exactly the records required for each scenario.
- Avoid relying on production randomness.
- For random draw screens, reduce candidate records to one.

3. Use stable selectors.
- Prefer role/name selectors for end-user actions.
- Add `data-testid` for ambiguous or repeated controls.
- Avoid brittle CSS-only selectors unless no alternative exists.

4. Implement spec by intent.
- Keep each test focused on one behavior.
- Use helper functions for repeated setup and actions.
- Keep assertions close to action boundaries.

5. Validate and harden.
- Run one spec first.
- If flaky, inspect race conditions, missing waits, and selector ambiguity.
- Then run full suite.

## Assertion Guidelines

- Visual assertions:
  - Capture named states (default, toggled, revealed, completed).
  - Avoid asserting exact row counts unless the seeded dataset guarantees it.
- Functional assertions:
  - Confirm persisted state after reload or revisit.
  - Check domain flags directly through UI behavior when possible.

## Output Expectations

- Provide:
  - Added/updated spec files
  - Seed fixture changes
  - Command results (`lint`, single-spec run, full check)
  - Known residual gaps

## References

- Case templates and anti-flakiness checklist: `references/case-patterns.md`
