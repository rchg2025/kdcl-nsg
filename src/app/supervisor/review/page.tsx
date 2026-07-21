import { Suspense } from "react"
import { getReviewEvidences } from "@/actions/supervisor"
import { getAllProgramsPublic } from "@/actions/category"
import ClientReviewList from "./ClientReviewList"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default function ReviewPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Duyệt Minh chứng</h1>
          <p className="text-slate-500 mt-1">Đánh giá và phê duyệt các minh chứng từ cộng tác viên</p>
        </div>
      </div>
      
      <Suspense fallback={<div className="w-full flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
        <ReviewDataWrapper />
      </Suspense>
    </div>
  )
}

async function ReviewDataWrapper() {
  const session = await getServerSession(authOptions)
  const [evidences, programs] = await Promise.all([
    getReviewEvidences(),
    getAllProgramsPublic()
  ])
  return <ClientReviewList initialEvidences={evidences} programs={programs} isAdmin={session?.user?.role === "ADMIN"} />
}
