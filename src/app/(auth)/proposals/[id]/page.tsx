import { redirect } from "next/navigation";

export default async function ProposalDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/events/${id}?view=review`);
}
