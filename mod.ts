export interface SetupTeardown {
  beforeAll?: () => void | Promise<void>;
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;
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

function wrapTest(
  fn: (t: Deno.TestContext) => void | Promise<void>,
): (t: Deno.TestContext) => void | Promise<void> {
  const innerFn = async (t: Deno.TestContext) => {
    if (setupTeardown.beforeEach) {
      setupTeardown.beforeEach();
    }

    await fn(t);

    if (setupTeardown.afterEach) {
      setupTeardown.afterEach();
    }
  };
  Object.defineProperty(innerFn, "name", { value: fn.name, writable: false });
  return innerFn;
}

export function register(testAugment: SetupTeardown) {
  setupTeardown = testAugment;

  // augment Deno.test
  Deno.test = (
    first:
      | Deno.TestDefinition
      | string
      | ((t: Deno.TestContext) => void | Promise<void>)
      | Omit<Deno.TestDefinition, "fn">
      | Omit<Deno.TestDefinition, "fn" | "name">,
    second?:
      | ((t: Deno.TestContext) => void | Promise<void>)
      | Omit<Deno.TestDefinition, "fn" | "name">,
    third?: (t: Deno.TestContext) => void | Promise<void>,
  ) => {
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

    if (!beforeAllExecuted) {
      if (setupTeardown.beforeAll) {
        setupTeardown.beforeAll();
      }
      beforeAllExecuted = true;
    }

    // @ts-ignore
    originalDenoTest(first, second, third);
  };
}
