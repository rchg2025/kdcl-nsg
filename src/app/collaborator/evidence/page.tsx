import { getCollaboratorEvidences, getAllCriteriaForDropdown } from "@/actions/evidence"
import { getPrograms } from "@/actions/category"
import ClientEvidenceList from "./ClientEvidenceList"

export default async function EvidencePage() {
  const [evidences, criteriaList, programs] = await Promise.all([
    getCollaboratorEvidences(),
    getAllCriteriaForDropdown(),
    getPrograms()
  ])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Cập nhật Minh chứng</h1>
          <p className="text-slate-500 mt-1">Báo cáo mức độ đạt được của các tiêu chuẩn</p>
        </div>
      </div>
      
      <ClientEvidenceList initialEvidences={evidences} criteriaList={criteriaList} programs={programs} />
    </div>
  )
}
