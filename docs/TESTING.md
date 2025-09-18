# Manual E2E Testing (Sprints 1-2)

## Authentication
- Visit `/register`, create a new account, ensure automatic redirect to `/groups`.
- Log out from header action, confirm redirect to `/login`.
- Log back in with the created credentials, verify toast success and access to groups.
- Attempt login with bad password to confirm error toast.

## Groups
- On `/groups`, create a group with name + base currency. Expect success toast and new card in list.
- From a second browser session/user, register and search via "Add members" box, add user, ensure success toast.
- Confirm members list in group detail shows both users with roles.

## Expenses & Splits
- Inside `/groups/[id]`, add an expense using each split mode (equal, unequal, percent, shares) and verify totals update and validation errors appear when sums mismatch.
- Delete an expense from the list to ensure it disappears and toast shows confirmation.

## Balances & Settlements
- After adding expenses, view balance summary to confirm positive/negative values per member.
- Click "Simplify balances" to generate suggested settlement plan.
- Use "Record settlement" to log a payment and verify it appears in settlement history and balances adjust.

## Error Handling
- Try to add the same member twice and ensure error toast displays.
- Remove cookies or clear local storage, reload protected routes and verify redirect to `/login`.

Document findings and regressions after each sprint in this file to support the agile feedback loop.