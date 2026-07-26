// Helpers for handling Neon's "compute time quota exceeded" state gracefully.
//
// When the free-tier compute allowance is used up, Neon rejects every query
// with Postgres error XX000 ("... exceeded the compute time quota ...") until
// the monthly billing period resets. For our scheduled cron scripts we'd rather
// SKIP (exit 0) than FAIL (exit 1) in that case, so GitHub Actions doesn't email
// a failure every few hours until the quota resets. Real errors still fail loudly.

interface MaybePgError {
  message?: string;
  cause?: { originalCode?: string; code?: string; originalMessage?: string; message?: string };
}

/** True if the error is Neon/Postgres signalling the compute quota is exhausted. */
export function isComputeQuotaError(e: unknown): boolean {
  const err = e as MaybePgError | null;
  const texts = [
    e instanceof Error ? e.message : typeof e === "string" ? e : "",
    err?.message,
    err?.cause?.originalMessage,
    err?.cause?.message,
  ].filter(Boolean) as string[];
  const quotaText = /compute time quota|exceeded the compute|compute quota/i;
  if (texts.some((t) => quotaText.test(t))) return true;
  // Fallback: XX000 with a quota-ish message.
  const code = err?.cause?.originalCode || err?.cause?.code;
  return code === "XX000" && texts.some((t) => /quota/i.test(t));
}

/**
 * Terminal handler for cron scripts. Treats a compute-quota exhaustion as a
 * non-fatal skip (exit 0); anything else fails (exit 1).
 */
export function exitForError(tag: string, e: unknown): never {
  if (isComputeQuotaError(e)) {
    console.warn(
      `[${tag}] SKIPPED — database compute quota is exhausted; this run is a no-op ` +
        `and will resume automatically when the Neon quota resets at the start of the next month.`
    );
    process.exit(0);
  }
  console.error(`[${tag}] FAILED:`, e);
  process.exit(1);
}
