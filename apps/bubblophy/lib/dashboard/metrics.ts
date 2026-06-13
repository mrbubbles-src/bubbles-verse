/**
 * Returns a stable readiness percentage for issue counts.
 *
 * Empty queues are treated as fully ready so dashboard copy never renders NaN.
 */
export function getIssueReadinessPercent({
  readyIssues,
  openIssues,
}: {
  readyIssues: number;
  openIssues: number;
}) {
  if (openIssues <= 0) {
    return 100;
  }

  return Math.round((readyIssues / openIssues) * 100);
}
