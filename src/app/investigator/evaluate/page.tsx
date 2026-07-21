import { Suspense } from "react"
import { getInvestigatorEvidences } from "@/actions/investigator"
import { getAllProgramsPublic } from "@/actions/category"
import ClientInvestigateList from "./ClientInvestigateList"

export default function InvestigatorEvaluatePage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Đánh giá Tiêu chuẩn</h1>
          <p className="text-slate-500 mt-1">Phản hồi và đánh giá mức độ đạt của các minh chứng (Chỉ hiển thị các minh chứng đã được Giám sát viên duyệt)</p>
        </div>
      </div>
      
      <Suspense fallback={<div className="w-full flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
        <InvestigatorDataWrapper />
      </Suspense>
    </div>
  )
}

async function InvestigatorDataWrapper() {
  const evidences = await getInvestigatorEvidences()
  const programs = await getAllProgramsPublic()
  return <ClientInvestigateList initialEvidences={evidences} programs={programs} />
}
