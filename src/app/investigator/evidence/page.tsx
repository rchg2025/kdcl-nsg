import { Suspense } from "react"
import { getInvestigatorEvidences } from "@/actions/investigator"
import { getAllProgramsPublic } from "@/actions/category"
import ClientInvestigatorEvidenceList from "./ClientInvestigatorEvidenceList"

export default function InvestigatorEvidencePage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Danh sách Minh chứng</h1>
          <p className="text-slate-500 mt-1">Xem toàn bộ các thông tin và tài liệu gốc của minh chứng đã được phê duyệt.</p>
        </div>
      </div>
      
      <Suspense fallback={<div className="w-full flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
        <InvestigatorEvidenceDataWrapper />
      </Suspense>
    </div>
  )
}

async function InvestigatorEvidenceDataWrapper() {
  const evidences = await getInvestigatorEvidences()
  const programs = await getAllProgramsPublic()
  return <ClientInvestigatorEvidenceList initialEvidences={evidences} programs={programs} />
}
