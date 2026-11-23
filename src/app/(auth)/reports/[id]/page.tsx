import { redirect } from "next/navigation";

export default async function EventReportDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/attendance/${id}`);
}
