import { register } from "./mod.ts";
import { assertEquals } from "./test_deps.ts";

const order: string[] = [];

function doSomeAsyncWork(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

register({
  async beforeAll() {
    await doSomeAsyncWork(50);
    order.push("Before all");
  },
  async beforeEach() {
    await doSomeAsyncWork(50);
    order.push("Before each");
  },
  async afterEach() {
    await doSomeAsyncWork(50);
    order.push("After each");
  },
  afterAll() {
    order.push("After all");
  },
});

Deno.test("test1", () => {
  order.push("_test1_");
});

Deno.test({
  name: "test2",
  fn: () => {
    order.push("_test2_");
  },
});

Deno.test(function test3() {
  order.push("_test3_");
});

Deno.test("test4", async () => {
  await doSomeAsyncWork(50);
  order.push("_test4_");
});

Deno.test(async function test5() {
  await doSomeAsyncWork(50);
  order.push("_test5_");
});

Deno.test("test6", { permissions: { read: true } }, (): void => {
  order.push("_test6_");
});

Deno.test("test7", { permissions: { read: true } }, async (): Promise<void> => {
  await doSomeAsyncWork(50);
  order.push("_test7_");
});

Deno.test(
  {
    name: "test8",
    permissions: { read: true },
  },
  () => {
    order.push("_test8_");
  },
);

Deno.test(
  {
    name: "test9",
    permissions: { read: true },
  },
  async () => {
    await doSomeAsyncWork(50);
    order.push("_test9_");
  },
);

Deno.test(
  { permissions: { read: true } },
  function test10() {
    order.push("_test10_");
  },
);

Deno.test(
  { permissions: { read: true } },
  async function test11() {
    await doSomeAsyncWork(50);
    order.push("_test11_");
  },
);

globalThis.addEventListener("unload", () => {
  const orderExpected: string[] = ["Before all"];
  for (let i = 1; i < 12; i++) {
    orderExpected.push("Before each");
    orderExpected.push(`_test${i}_`);
    orderExpected.push("After each");
  }
  orderExpected.push("After all");
  assertEquals(order, orderExpected);
  console.log("Tests passed");
});
