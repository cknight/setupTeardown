export interface SetupTeardown {
  /* Executed once before all tests */
  beforeAll?: () => void | Promise<void>;
  /* Executed once after each test */
  beforeEach?: () => void | Promise<void>;
  /* Executed once after each test */
  afterEach?: () => void | Promise<void>;
  /* Executed once after all tests.  Must be a synchronous function. */
  afterAll?: () => undefined;
}

let setupTeardown: SetupTeardown = {};
let beforeAllExecuted = false;
const originalDenoTest = Deno.test;

globalThis.addEventListener("unload", () => {
  try {
    if (setupTeardown.afterAll) {
      setupTeardown.afterAll();
    }
  } finally {
    setupTeardown = {};
    beforeAllExecuted = false;
    Deno.test = originalDenoTest;
  }
});

/**
 * Register a series of setup and teardown functions to be executed before and
 * after tests.
 * @param testAugment 
 */
export function register(testAugment: SetupTeardown) {
  setupTeardown = testAugment;
  Deno.test = augmentedTest;
}

function augmentedTest(t: Deno.TestDefinition): void;
function augmentedTest(
  name: string,
  fn: (t: Deno.TestContext) => void | Promise<void>,
): void;
function augmentedTest(fn: (t: Deno.TestContext) => void | Promise<void>): void;
function augmentedTest(
  name: string,
  options: Omit<Deno.TestDefinition, "fn" | "name">,
  fn: (t: Deno.TestContext) => void | Promise<void>,
): void;
function augmentedTest(
  options: Omit<Deno.TestDefinition, "fn">,
  fn: (t: Deno.TestContext) => void | Promise<void>,
): void;
function augmentedTest(
  options: Omit<Deno.TestDefinition, "fn" | "name">,
  fn: (t: Deno.TestContext) => void | Promise<void>,
): void;
function augmentedTest(
  first:
    | string
    | Deno.TestDefinition
    | Omit<Deno.TestDefinition, "fn" | "name">
    | Omit<Deno.TestDefinition, "fn">
    | ((t: Deno.TestContext) => void | Promise<void>),
  second?:
    | ((t: Deno.TestContext) => void | Promise<void>)
    | Omit<Deno.TestDefinition, "fn" | "name">,
  third?: (t: Deno.TestContext) => void | Promise<void>,
): void {
  if (first instanceof Function) {
    first = wrapTest(first);
  } else if (typeof first === "object" && Object.hasOwn(first, "fn")) {
    const firstTd = first as Deno.TestDefinition;
    firstTd.fn = wrapTest(firstTd.fn);
  }
  if (second && second instanceof Function) {
    second = wrapTest(second);
  }
  if (third && third instanceof Function) {
    third = wrapTest(third);
  }
  // @ts-ignore - Arguments are correctly typed, but TS doesn't like it
  originalDenoTest(first, second, third);
}

function wrapTest(
  fn: (t: Deno.TestContext) => void | Promise<void>,
): (t: Deno.TestContext) => void | Promise<void> {
  const innerFn = async (t: Deno.TestContext) => {
    if (!beforeAllExecuted && setupTeardown.beforeAll) {
      await setupTeardown.beforeAll();
      beforeAllExecuted = true;
    }

    if (setupTeardown.beforeEach) {
      await setupTeardown.beforeEach();
    }

    await fn(t);

    if (setupTeardown.afterEach) {
      await setupTeardown.afterEach();
    }
  };
  Object.defineProperty(innerFn, "name", { value: fn.name, writable: false });
  return innerFn;
}
