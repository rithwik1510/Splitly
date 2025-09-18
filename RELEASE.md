# Release

## Versioning
- Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`
- Bump: features => MINOR, fixes => PATCH, breaking changes => MAJOR

## Checklist
1. Ensure CI is green on `main`
2. Update CHANGELOG (or release notes) with highlights
3. Confirm README/ARCHITECTURE are current
4. Tag the release (e.g., `v0.2.0`) and push tags
5. Deploy backend migrations and verify app health

## Notes
- Demo data toggle `NEXT_PUBLIC_ENABLE_DEMO_PREVIEW` must be disabled in production.

