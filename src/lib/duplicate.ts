/**
 * Bidirectional startsWith check — catches exact matches and the common case
 * where one URL is the other plus extra query params or a fragment.
 */
export function isPossibleDuplicateUrl(a: string, b: string): boolean {
  if (a === b) return true;
  return a.startsWith(b) || b.startsWith(a);
}
