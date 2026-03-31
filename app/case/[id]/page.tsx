import { CaseSessionProvider } from "@/components/case/CaseSessionContext";
import { CasePlayClient } from "@/components/case/CasePlayClient";

export default async function CasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const classSessionId = sp.session?.trim() || null;
  return (
    <CaseSessionProvider>
      <CasePlayClient caseId={id} classSessionId={classSessionId} />
    </CaseSessionProvider>
  );
}
