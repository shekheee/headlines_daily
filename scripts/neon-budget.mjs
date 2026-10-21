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
  if (!Number.isFinite(used) || !Number.isFinite(allowance) || allowance <= 0) {
    throw new Error("Invalid compute usage or allowance");
  }
  return {
    usedCuHours: +used.toFixed(2),
    allowanceCuHours: allowance,
    projectedCuHours: +(used / elapsedDays * (elapsedDays + remainingDays)).toFixed(2),
    remainingCuHours: +Math.max(allowance - used, 0).toFixed(2),
    dailyBudgetCuHours: +(Math.max(allowance - used, 0) / Math.max(remainingDays, 1)).toFixed(2),
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
  if (budget.usedCuHours >= budget.allowanceCuHours || budget.projectedCuHours > budget.allowanceCuHours * 0.8) {
    throw new Error(`Compute budget at risk: ${budget.usedCuHours} CU-h used; ${budget.projectedCuHours} CU-h projected. Target under 80 CU-h/month.`);
  }
}

if (process.argv[1]?.endsWith("neon-budget.mjs")) {
  checkBudget().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
