import { register } from "./mod.ts";

const order: string[] = [];

register({
  beforeAll() {
    order.push("Before all");
  },
  beforeEach() {
    order.push("Before each");
  },
  afterEach() {
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

// Deno.test(function test3() {
//   order.push("_test3_");
// });

globalThis.addEventListener("unload", () => {
  console.log("order:", order);
});
