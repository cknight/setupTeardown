# setupTeardown

This module augments `Deno.test` to provide the following functionality:

- beforeAll
- beforeEach
- afterEach
- afterAll

The scope of the before/after functions is limited to a single module test file.
E.g. if you have two test files, a_test.ts and b_test.ts, and you register
before or after functions in a_test.ts, it will have no affect on b_test.ts. In
other words, `beforeAll` applies at a module level, not an overall test run
level (which executes multiple test files).

Asynchronous execution of all before/after functions is available except for
`afterAll` which must be synchronous. All functions are optional and are
registered via the `register()` function.

### Example

```ts
import { register } from "./mod.ts";

const order: string[] = [];

register({
  beforeAll() {
    order.push("Before all");
  },
  beforeEach() {
    order.push("  Before each");
  },
  afterEach() {
    order.push("  After each");
  },
  afterAll() {
    order.push("After all");
  },
});

Deno.test("test1", () => {
  order.push("    _test1_");
});

Deno.test("test2", () => {
  order.push("    _test2_");
});

globalThis.addEventListener("unload", () => {
  // Output results after all tests have finished executing
  console.log("order:", order);
});
```

Outputs:

```sh
order: [
  "Before all",
  "  Before each",
  "    _test1_",
  "  After each",
  "  Before each",
  "    _test2_",
  "  After each",
  "After all"
]
```
