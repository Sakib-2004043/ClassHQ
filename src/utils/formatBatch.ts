/**
 * Ensures the batch string is prefixed with "HSC " if not already present.
 * e.g. "2028" → "HSC 2028", "HSC 2027" → "HSC 2027" (no double prefix)
 */
export const formatBatch = (batch: string | undefined | null, fallback = 'N/A'): string => {
  if (!batch || batch.trim() === '') return fallback;
  const trimmed = batch.trim();
  if (trimmed.toUpperCase().startsWith('HSC')) return trimmed;
  return `HSC ${trimmed}`;
};
