import { getCollaboratorEvidences, getAllCriteriaForDropdown } from "@/actions/evidence"
import ClientEvidenceList from "@/app/collaborator/evidence/ClientEvidenceList"

export default async function SupervisorEvidencePage() {
  const [evidences, criteriaList] = await Promise.all([
    getCollaboratorEvidences(),
    getAllCriteriaForDropdown()
  ])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Cập nhật Minh chứng</h1>
          <p className="text-slate-500 mt-1">Giám sát viên báo cáo mức độ đạt được của các tiêu chuẩn</p>
        </div>
      </div>
      
      <ClientEvidenceList initialEvidences={evidences} criteriaList={criteriaList} />
    </div>
  )
}
