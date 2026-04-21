import { getInvestigatorEvidences } from "@/actions/investigator"
import ClientInvestigateList from "./ClientInvestigateList"

export default async function InvestigatorEvaluatePage() {
  const evidences = await getInvestigatorEvidences()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Đánh giá Tiêu chuẩn</h1>
          <p className="text-slate-500 mt-1">Phản hồi và đánh giá mức độ đạt của các minh chứng (Chỉ hiển thị các minh chứng đã được Giám sát viên duyệt)</p>
        </div>
      </div>
      
      <ClientInvestigateList initialEvidences={evidences} />
    </div>
  )
}
