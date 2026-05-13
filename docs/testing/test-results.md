# Test Results

This file records the automated and manual testing evidence for the dissertation project.

## Automated Commands

Run these commands after code changes:

```bash
npm run lint
npm run build
npm run test:unit
npm run test:integration
```

Run the E2E smoke tests when the local database has been seeded and the app can start:

```bash
npm run db:seed
npm run test:e2e
```

If the app is already running on `http://127.0.0.1:3000`, use:

```bash
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
```

## Expected Evidence

- `npm run lint` should complete with no ESLint errors.
- `npm run build` should complete and list the App Router routes.
- `npm run test:unit` should pass deterministic helper tests for quiz state, revision access, password handling, and CSRF validation.
- `npm run test:integration` should pass mocked route tests for login validation, module creation, quiz attempts, and slide-upload validation.
- `npm run test:e2e` should pass seeded-data smoke tests for lecturer and student journeys.

## Manual Testing Evidence

Use `docs/testing/manual-test-plan.md` for manual testing of:

- slide extraction with real PDF/PPTX files;
- OpenAI-generated analogy and quiz quality;
- optional Gemini image generation;
- local/S3 media upload and replacement;
- statistics pages checked against demo data;
- Docker startup and demo readiness.

Record date, tester, environment, and pass/fail notes below when manual testing is performed.

| Date | Tester | Environment | Areas Tested | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-05-13 | Codex | Local macOS workspace | `npm run test:unit` | Pass | 4 files, 14 tests passed. |
| 2026-05-13 | Codex | Local macOS workspace | `npm run test:integration` | Pass | 4 files, 21 mocked route tests passed. |
| 2026-05-13 | Codex | Local macOS workspace | `npm run lint` | Pass | ESLint passed; existing `baseline-browser-mapping` stale-data warning shown. |
| 2026-05-13 | Codex | Local macOS workspace | `npm run build` | Pass | Next.js production build completed and listed App Router routes. |
| 2026-05-13 | Codex | Local macOS workspace | `npm run test:e2e` | Partial pass | Home-page smoke test passed. Lecturer/student credentialed smoke tests skipped because seeded demo accounts were not available in this environment. |
