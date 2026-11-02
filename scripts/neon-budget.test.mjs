import test from "node:test";
import assert from "node:assert/strict";
import { estimateBudget } from "./neon-budget.mjs";

const project = {
  consumption_period_start: "2026-11-01T00:00:00Z",
  consumption_period_end: "2026-12-01T00:00:00Z",
  compute_time_seconds: 10 * 3600,
  data_transfer_bytes: 5_628_679_265,
};

test("detects exhausted transfer even when most compute remains", () => {
  const budget = estimateBudget(project, new Date("2026-11-03T00:00:00Z"));
  assert.equal(budget.usedCuHours, 10);
  assert.equal(budget.remainingCuHours, 90);
  assert.equal(budget.usedTransferGB, 5.629);
  assert.equal(budget.remainingTransferGB, 0);
  assert.ok(budget.projectedTransferGB > budget.allowanceTransferGB);
});

test("uses the actual month's length in the forecast", () => {
  const budget = estimateBudget({ ...project, compute_time_seconds: 4 * 3600, data_transfer_bytes: 100_000_000 }, new Date("2026-11-03T00:00:00Z"));
  assert.equal(budget.projectedCuHours, 60);
  assert.equal(budget.projectedTransferGB, 1.5);
});

test("does not silently treat missing transfer data as zero", () => {
  assert.throws(() => estimateBudget({ ...project, data_transfer_bytes: undefined }), /Invalid database transfer/);
});
