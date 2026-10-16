import assert from "node:assert/strict";
import test from "node:test";
import { allocate } from "../src/lib/allocation.ts";

const orders = [
  { id: "SO-1041", dueDate: "2026-10-25", required: 4 },
  { id: "SO-1042", dueDate: "2026-10-28", required: 3 },
  { id: "SO-1043", dueDate: "2026-11-15", required: 1 },
];

test("delay exposes two shortages while the later order stays covered", () => {
  assert.deepEqual(allocate(orders, 2, 6, "2026-11-05"), [
    { id: "SO-1041", covered: 2, shortage: 2 },
    { id: "SO-1042", covered: 0, shortage: 3 },
    { id: "SO-1043", covered: 1, shortage: 0 },
  ]);
});

test("arrival on the due date counts and units are never allocated twice", () => {
  assert.deepEqual(allocate([...orders].reverse(), 2, 6, "2026-10-25").map((order) => order.shortage), [0, 0, 0]);
  assert.deepEqual(allocate(orders, 0, 0, "2026-10-20").map((order) => order.covered), [0, 0, 0]);
});
