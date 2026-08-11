import { JoinView } from "@/components/trip/JoinView";

/**
 * The landing page behind a shared link.
 *
 * proxy.ts already bounces a signed-out visitor to /login?next=/join/CODE, so
 * by the time this renders the viewer has an account and the code can be
 * previewed and redeemed against their identity.
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <JoinView code={code} />;
}
