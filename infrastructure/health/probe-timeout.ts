export const PROBE_TIMEOUT_MS = 15_000;
export const SLOW_PROBE_TIMEOUT_MS = 25_000;

export function withProbeTimeout<T>(
  promise: Promise<T>,
  ms = PROBE_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("探測逾時")), ms);
    }),
  ]);
}
