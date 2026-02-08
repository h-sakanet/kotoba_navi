# E2E Case Patterns

## Pattern 1: Visual State Sequence

Use for UI regression checks.

Sequence example:
1. default
2. toggle-on
3. revealed
4. edit-mode

Rule:
- Keep screenshot names stable and state-oriented.
- Capture only meaningful state transitions.

## Pattern 2: Functional Persistence

Use for edit/save behavior.

Sequence example:
1. enter edit mode
2. change field value
3. save
4. reload
5. reopen edit mode
6. assert edited value persisted

Rule:
- Assert persisted value on editable control, not only rendered text.

## Pattern 3: Randomized Screen Stabilization

Use when question order is random.

Rule:
- Seed one candidate record for deterministic first question.
- Remove assertions that assume multi-record count unless you control exact seed.

## Anti-Flakiness Checklist

- Data seeded before navigation
- Role/name or `data-testid` selector used
- Assertions wait for visible/attached state
- No strict timing sleeps
- No brittle dependency on animation frame order
- Failure artifacts inspected from `test-results` and `playwright-report`
