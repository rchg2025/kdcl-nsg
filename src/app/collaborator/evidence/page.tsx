import { Suspense } from "react"
import { getCollaboratorEvidences } from "@/actions/evidence"
import { getAllProgramsPublic } from "@/actions/category"
import ClientEvidenceList from "./ClientEvidenceList"

export default function EvidencePage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Danh sách minh chứng</h1>
          <p className="text-slate-500 mt-1">Báo cáo mức độ đạt được của các tiêu chuẩn</p>
        </div>
      </div>
      
      <Suspense fallback={<div className="w-full flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
        <EvidenceDataWrapper />
      </Suspense>
    </div>
  )
}

async function EvidenceDataWrapper() {
  const [evidences, programs] = await Promise.all([
    getCollaboratorEvidences(),
    getAllProgramsPublic()
  ])
  return <ClientEvidenceList initialEvidences={evidences} programs={programs} />
}
