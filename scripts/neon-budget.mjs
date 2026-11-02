// Management API only: checking usage must never wake the Postgres compute.
export function estimateBudget(project, now = new Date()) {
  const start = Date.parse(project.consumption_period_start);
  const end = Date.parse(project.consumption_period_end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("Neon did not return a valid billing period");
  }
  const elapsedDays = Math.max((now.getTime() - start) / 86400000, 1 / 24);
  const remainingDays = Math.max((end - now.getTime()) / 86400000, 0);
  const used = project.compute_time_seconds / 3600;
  const allowance = Number(process.env.NEON_MONTHLY_CU_HOURS || 100);
  // Quotas are shown in GB; use the conservative decimal-GB threshold.
  const transfer = project.data_transfer_bytes / 1e9;
  const transferAllowance = Number(process.env.NEON_MONTHLY_TRANSFER_GB || 5);
  if (!Number.isFinite(used) || !Number.isFinite(allowance) || allowance <= 0) {
    throw new Error("Invalid compute usage or allowance");
  }
  if (!Number.isFinite(transfer) || transfer < 0 || !Number.isFinite(transferAllowance) || transferAllowance <= 0) {
    throw new Error("Invalid database transfer usage or allowance");
  }
  return {
    usedCuHours: +used.toFixed(2),
    allowanceCuHours: allowance,
    projectedCuHours: +(used / elapsedDays * (elapsedDays + remainingDays)).toFixed(2),
    remainingCuHours: +Math.max(allowance - used, 0).toFixed(2),
    dailyBudgetCuHours: +(Math.max(allowance - used, 0) / Math.max(remainingDays, 1)).toFixed(2),
    usedTransferGB: +transfer.toFixed(3),
    allowanceTransferGB: transferAllowance,
    projectedTransferGB: +(transfer / elapsedDays * (elapsedDays + remainingDays)).toFixed(3),
    remainingTransferGB: +Math.max(transferAllowance - transfer, 0).toFixed(3),
    resetAt: project.consumption_period_end,
  };
}

export async function checkBudget() {
  if (!process.env.NEON_API_KEY) throw new Error("NEON_API_KEY is missing");
  const projectId = process.env.NEON_PROJECT_ID || "soft-heart-60989635";
  const response = await fetch(`https://console.neon.tech/api/v2/projects/${encodeURIComponent(projectId)}`, {
    headers: { Authorization: `Bearer ${process.env.NEON_API_KEY}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Neon management API returned HTTP ${response.status}`);
  const { project } = await response.json();
  const budget = estimateBudget(project);
  console.log(JSON.stringify(budget, null, 2));
  const warnings = [];
  if (project.compute_time_seconds / 3600 >= budget.allowanceCuHours || budget.projectedCuHours > budget.allowanceCuHours * 0.8) {
    warnings.push(`Compute: ${budget.usedCuHours} CU-h used; ${budget.projectedCuHours} CU-h projected`);
  }
  if (project.data_transfer_bytes / 1e9 >= budget.allowanceTransferGB || budget.projectedTransferGB > budget.allowanceTransferGB * 0.8) {
    warnings.push(`Database transfer: ${budget.usedTransferGB} GB used; ${budget.projectedTransferGB} GB projected`);
  }
  if (warnings.length) throw new Error(`Neon budget at risk. ${warnings.join(". ")}`);
}

if (process.argv[1]?.endsWith("neon-budget.mjs")) {
  checkBudget().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
