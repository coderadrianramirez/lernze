/** Se exige una sesión verificada obtenida desde un enlace de recuperación reciente. */
export function isRecoverySession(
  claims: { sub?: string; amr?: unknown } | null | undefined,
  userId: string,
  now = Date.now(),
) {
  return (
    claims?.sub === userId &&
    Array.isArray(claims.amr) &&
    claims.amr.some((entry: unknown) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        !("method" in entry) ||
        !("timestamp" in entry)
      )
        return false;
      return (
        entry.method === "recovery" &&
        typeof entry.timestamp === "number" &&
        Number.isFinite(entry.timestamp) &&
        entry.timestamp * 1000 <= now + 60000 &&
        entry.timestamp * 1000 > now - 30 * 60 * 1000
      );
    })
  );
}
