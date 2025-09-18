# Splitly Copy Guide

## Tone and Voice
- Friendly, encouraging, and concise. Avoid jargon.
- Use American English spelling (recognize, personalize).
- Avoid contractions in system feedback (use "We could not" instead of "We couldn't").
- Speak directly to the user with "you" phrasing when relevant.

## Terminology
- `group` – Shared space for members; lowercase unless part of a title.
- `expense` – Individual line item tracked inside a group.
- `split` or `Split dashboard` – The primary post-login view summarizing balances.
- `settlement` – Payment action that clears or simplifies balances.

## Patterns to Reuse
- Loading: "Loading your groups...", "Compiling your ledger..." (paired with aria-live regions).
- Empty states: "No groups yet. Create your first one to start sharing expenses." (no exclamation marks).
- Success toasts: Start with a verb, e.g., "Created Barcelona Getaway".
- Error toasts: Start with "We could not..." followed by actionable guidance when possible.
- Navigation affordances: "Back to dashboard", "Manage groups", "Add expense".

## Formatting
- Use sentence case for headings and buttons.
- Prefer lists or short paragraphs for helper text under section headers.
- Keep button labels under three words when possible.

Refer back to this guide when introducing new UI copy or updating existing messaging to keep Splitly consistent end-to-end.
