/**
 * Displays XP earned beyond the 100-XP level threshold.
 * Renders "+N XP over" as neutral, informational text.
 *
 * @param overXp - The surplus XP above 100. Must be > 0 when rendered.
 */
export function OverXpIndicator({ overXp }: { overXp: number }) {
  return (
    <span className="text-sm font-medium text-foreground">
      +{overXp} XP over
    </span>
  )
}
