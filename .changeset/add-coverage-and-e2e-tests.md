---
"@better-conversation/adapter-mongodb": patch
---

Add test coverage and E2E tests

- **adapter-mongodb**: Add specs for mongodbAdapter (returns DatabaseAdapter shape, stub throws)
- **e2e**: New package (private) with E2E tests for Express (supertest) and Hono (fetch)
- **coverage**: Add `bun test:coverage` script
- **TESTS_POLICY**: Document E2E package and in-memory adapter
