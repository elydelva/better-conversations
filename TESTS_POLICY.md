# Testing Policy — better-conversation

A strict testing policy for the better-conversations monorepo. All tests follow these rules.

---

## 1. Test runner and framework

- **Runner**: `bun test` only. No Vitest, Jest, or Node test runners.
- **API**: `bun:test` — `test()`, `expect()`, `describe()`.

```ts
import { expect, test, describe } from "bun:test";
```

---

## 2. File structure: colocate with `.spec.ts`

Tests live **next to** the code they exercise. No separate `__tests__/` or `tests/` directories.

| Feature file          | Spec file              |
|-----------------------|------------------------|
| `BlockService.ts`     | `BlockService.spec.ts` |
| `OutcomeBuilder.ts`   | `OutcomeBuilder.spec.ts` |
| `adapter.ts`          | `adapter.spec.ts`      |
| `path.ts`             | `path.spec.ts`         |

**Exception**: Package-level or integration tests that span multiple modules may live in `src/index.spec.ts` or a dedicated `src/integration.spec.ts` at the package root.

---

## 3. What makes a good test

### 3.1 One behavior per test

Each `test()` focuses on a **single behavior**. The description is a clear statement of that behavior.

```ts
// Good
test("BlockService.send throws BlockRefusedError when hook returns refuse", async () => { ... });
test("createAdapterHelpers uses crypto.randomUUID when no generateId provided", () => { ... });

// Bad — multiple behaviors in one test
test("BlockService works", async () => {
  // tests create, send, delete, and error handling
});
```

### 3.2 Synthetic testing

Use **minimal, targeted setups**, not full application wiring. Tests should:

- Mock only what is needed
- Use small, predictable data
- Run quickly

```ts
// Good — minimal mock
const mockBlocks = {
  create: async (data: BlockInput) => ({ ...data, id: "b1", createdAt: new Date() }),
  find: async () => null,
  list: async () => ({ items: [], total: 0 }),
  update: async () => ({}),
  softDelete: async () => {},
};

// Bad — spinning up real DB or full engine when a stub suffices
```

### 3.3 Arrange–Act–Assert

Structure each test in three phases:

1. **Arrange**: Set up inputs, mocks, and preconditions.
2. **Act**: Call the function or method under test.
3. **Assert**: Check the outcome with `expect()`.

```ts
test("ParticipantService.add throws ParticipantAlreadyJoinedError when participant exists", async () => {
  // Arrange
  const participants = { find: async () => ({ id: "p1", leftAt: null }), add: async () => ({}), ... };
  const service = new ParticipantService({ participants } as any);

  // Act & Assert
  await expect(service.add({ conversationId: "c1", chatterId: "ch1", role: "member" }))
    .rejects.toThrow(ParticipantAlreadyJoinedError);
});
```

### 3.4 Test behavior, not implementation

Assert on **observable outcomes** (return values, thrown errors, side effects via mocks). Do not depend on internal variables, call order, or private methods.

```ts
// Good — asserts observable result
expect(chatter.displayName).toBe("Test User");

// Bad — asserts internal state
expect((service as any).adapter.callCount).toBe(1);
```

---

## 4. Edge case identification

### 4.1 Categories to consider

When writing tests, systematically cover:

| Category       | Examples |
|----------------|----------|
| **Happy path** | Valid inputs, expected success |
| **Empty/null** | `null`, `undefined`, `[]`, `""` |
| **Boundaries** | `limit: 0`, `limit: 1`, max lengths |
| **Invalid**    | Wrong types, missing required fields |
| **Not found**  | `find()` returns `null` |
| **Concurrency**| Duplicate add, race conditions |
| **Permissions**| Denied, allowed, partial |

### 4.2 Decision matrix for “what to test”

1. **Public API**: Every exported function or class method that does non-trivial logic.
2. **Error paths**: Every `throw` and every branch that returns an error (e.g. `ConversationError` subclasses).
3. **Domain invariants**: Business rules (e.g. “cannot add participant twice”, “cannot write on archived conversation”).
4. **Adapters**: At least one CRUD path per entity; error handling for “not found” and invalid input.
5. **Handlers**: Route dispatch, param extraction, body parsing, error-to-response mapping.

**Skip**: Pure types, trivial getters, re-exports, and framework glue that only delegates.

---

## 5. Package-specific conventions

### 5.1 Core (`@better-conversation/core`)

- Service tests: mock `DatabaseAdapter` and `ConversationConfig`; assert service behavior.
- Hook/outcome tests: mock adapter + hooks; verify `refuse` → `BlockRefusedError`, `transform` → modified block.
- Handler tests: mock `ConversationEngine`; assert `dispatch()` returns correct `CoreResponse` for given `CoreRequest`.
- Shared helpers: `createAdapterHelpers`, `matchPath`, `parseJsonBody`, `errorToResponse` — unit tests only.

### 5.2 Errors (`@better-conversation/errors`)

- Each error class: `code`, `statusCode`, `metadata`, `expose`, `retryAfter`.
- `isConversationError` and `toJsonPayload`: type guard and serialization behavior.

### 5.3 Adapters (`adapter-drizzle`, etc.)

- Integration tests against a real DB when possible (e.g. SQLite in CI).
- Unit tests for mappers and helpers using faked rows.
- Conformance: same test matrix for all adapters (CRUD, filters, pagination).

### 5.4 Handlers (`handler-next`, etc.)

- Request/response mapping: `toCoreRequest`, `toNextResponse` (or equivalent) with sample `NextRequest`.
- Route matching: `findRoute()` with various paths and methods.
- Error handling: `ConversationError` → correct HTTP status and body.

### 5.5 Blocks, roles, plugins

- Block definitions: schema validation, type registration.
- Role definitions: policy merge, defaults.
- Plugins: init, hooks, and minimal integration with engine.

---

## 6. Mocking guidelines

### 6.1 Mock interfaces, not implementations

Prefer hand-built objects that implement the interface:

```ts
const mockChatterAdapter: ChatterAdapter = {
  find: async () => null,
  findByEntity: async () => null,
  create: async (data) => ({ ...data, id: "c1", createdAt: new Date(), updatedAt: new Date() }),
  update: async () => createMockChatter(),
};
```

### 6.2 Spy only when necessary

Use a minimal spy when you need to assert “this was called”:

```ts
const createSpy = { calls: 0, fn: async () => { createSpy.calls++; return result; } };
// ... act ...
expect(createSpy.calls).toBe(1);
```

Prefer asserting on observable results over spy counts when possible.

### 6.3 Shared test fixtures

Place reusable mocks and factories in `src/test-fixtures.ts` or next to the spec. Do not import from production code for test-only helpers.

---

## 7. Naming conventions

- **File**: `<Feature>.spec.ts`
- **Describe**: `describe("BlockService")` or `describe("dispatch")`
- **Test**: `test("does X when Y", ...)` — present tense, behavior-focused

```ts
describe("BlockService", () => {
  test("send throws BlockRefusedError when onBlockBeforeSend returns refuse", async () => { ... });
  test("send creates block with flaggedAt when hook returns flag", async () => { ... });
});
```

---

## 8. Exclusions and config

- Spec files are excluded from the build (`**/*.spec.ts`, `**/*.test.ts` in `tsconfig` `exclude`).
- Run all tests: `bun test` at the repo root (discovers specs in all packages).
- Run one package: `bun test packages/core` or `cd packages/core && bun test`.

---

## 9. Checklist for new features

Before merging a feature:

- [ ] Spec file colocated: `<Feature>.spec.ts` next to the feature.
- [ ] Happy path covered.
- [ ] Relevant error paths covered (not found, validation, domain errors).
- [ ] Edge cases (empty, null, boundaries) considered.
- [ ] No implementation details asserted.
- [ ] Mocks are minimal and stable.
- [ ] `bun test` passes.
- [ ] No `.only` or `.skip` left in committed code.

---

## 10. Anti-patterns (avoid)

| Anti-pattern | Instead |
|--------------|---------|
| Giant test files | Split by module or behavior; one describe per unit |
| Testing third-party libs | Test our usage, not Drizzle/Next internals |
| Flaky timeouts | Prefer deterministic mocks; avoid `setTimeout` in tests |
| Hardcoded IDs everywhere | Use small constants or factories (e.g. `createMockChatter()`) |
| Async without awaiting | Always `await` async calls in tests |
| Asserting console output | Assert return values and thrown errors |
