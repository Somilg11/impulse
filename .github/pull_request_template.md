## What and why

<!-- What does this change, and what problem does it solve? Link the issue. -->

Closes #

## How

<!-- The approach, and any alternative you rejected. -->

## Verification

<!-- How did you confirm this works? Commands run, cases covered. -->

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Verified manually in the running app

## Security checklist

Tick what applies, or write N/A.

- [ ] Any new server action that takes an id calls a `lib/authz.ts` assertion
      with the right minimum role
- [ ] No new server-side fetch of a user-supplied URL bypasses `assertUrlIsSafe`
- [ ] No secrets, tokens, or response bodies added to logs
- [ ] Schema change ships with a migration, and the migration is safe on a
      populated table (no required column without a default)

## Screenshots

<!-- For UI changes. -->
