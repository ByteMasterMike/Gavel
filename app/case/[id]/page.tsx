import { CaseSessionProvider } from "@/components/case/CaseSessionContext";
import { CasePlayClient } from "@/components/case/CasePlayClient";

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <CaseSessionProvider>
      <CasePlayClient caseId={id} />
    </CaseSessionProvider>
  );
}
