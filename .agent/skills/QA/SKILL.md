---
name: Automated QA
description: Automatically detect and prevent implementation mistakes using Linting and User Event testing.
---

# Automated QA Skill

This skill provides a standard for ensuring code quality and accessibility, specifically aimed at catching issues like "unclickable interactive elements" or "hidden accessibility bugs" before they reach production.

## 1. Static Analysis (Linting)

We use `eslint-plugin-jsx-a11y` to enforce accessibility rules.

**Procedure:**
1.  **Check for Red Squiggles**: While coding, pay attention to ESLint warnings.
2.  **Fix Common Errors**:
    - **Visible, Non-Interactive Elements with Click Handlers**:
        - *Error*: `Visible, non-interactive elements with click handlers must have at least one keyboard listener.`
        - *Fix*: Use `<button>` or `<a href="...">` instead of `<div onClick=...>` or `<span>`.
        - *Why*: Semantically correct elements are accessible by default.
    - **Missing Labels**:
        - *Error*: `Form label must have associated control`.
        - *Fix*: Wrap the input in a `<label>` tag or use `htmlFor` with an ID.

## 2. Dynamic Testing (User Event)

We use `@testing-library/user-event` instead of `fireEvent` to simulate real user interactions.

**Procedure:**
1.  **Import**: `import userEvent from '@testing-library/user-event'`
2.  **Setup**: `const user = userEvent.setup()` (Do this inside the test or `describe` block)
3.  **Action**: Use `await user.click(element)` instead of `fireEvent.click(element)`.
    - Note the `await`. User events are asynchronous.
4.  **Verification**:
    - If `user.click()` fails, it means the element is likely unclickable (hidden, covered, or `pointer-events: none`).
    - This is a *good* failure. It means you caught a bug!

### Example

**Bad (Old Way):**
```typescript
fireEvent.click(screen.getByText('Submit')); // Might pass even if button is obscured
```

**Good (New Way):**
```typescript
const user = userEvent.setup();
await user.click(screen.getByRole('button', { name: 'Submit' })); // Fails if button is not interactive
```
