import { redirect } from "next/navigation";

export default function NewProposalRedirectPage() {
  redirect("/events/new");
}
