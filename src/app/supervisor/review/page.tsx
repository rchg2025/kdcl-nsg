import { getReviewEvidences } from "@/actions/supervisor"
import ClientReviewList from "./ClientReviewList"

export default async function ReviewPage() {
  const evidences = await getReviewEvidences()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Duyệt Minh chứng</h1>
          <p className="text-slate-500 mt-1">Đánh giá và phê duyệt các minh chứng từ cộng tác viên</p>
        </div>
      </div>
      
      <ClientReviewList initialEvidences={evidences} />
    </div>
  )
}
