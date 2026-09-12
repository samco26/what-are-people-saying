/** Safe diagnostics: no provider messages, credentials, inputs or social content. */
export class AnalysisFailure extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}
export function providerFailure(stage: "classification" | "summary", error: unknown): AnalysisFailure {
  const info = error as { status?: unknown; name?: unknown } | undefined;
  const timeout = info?.name === "TimeoutError" || info?.name === "AbortError" || info?.name === "APIUserAbortError" || info?.name === "APIConnectionTimeoutError";
  const status = typeof info?.status === "number" && Number.isInteger(info.status) && info.status >= 400 && info.status <= 599 ? `_${info.status}` : "";
  return new AnalysisFailure(`${stage}_${timeout ? "timeout" : "provider"}${status}`, "The discussion check could not finish. Please try again.");
}
