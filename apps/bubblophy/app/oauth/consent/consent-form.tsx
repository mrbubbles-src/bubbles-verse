import { Button } from '@bubbles/ui/shadcn/button';

/**
 * Submits an explicit OAuth approval or denial to Bubblophy's protected route.
 *
 * @param props.authorizationId Validated Supabase authorization request ID.
 * @returns A native POST form with two unambiguous decisions.
 */
export function BubblophyOAuthConsentForm({
  authorizationId,
}: {
  authorizationId: string;
}) {
  return (
    <form
      action="/api/oauth/decision"
      method="post"
      className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
      <input type="hidden" name="authorization_id" value={authorizationId} />
      <Button type="submit" name="decision" value="deny" variant="outline">
        Ablehnen
      </Button>
      <Button type="submit" name="decision" value="approve">
        Zugriff erlauben
      </Button>
    </form>
  );
}
