import { getCriteria } from "@/actions/criterion"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import ClientCriterionList from "./ClientCriterionList"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function CriteriaDetailPage({ params }: { params: { standardId: string } }) {
  const standardId = params.standardId
  
  const standard = await prisma.standard.findUnique({
    where: { id: standardId }
  })
  
  if (!standard) {
    notFound()
  }

  const criteria = await getCriteria(standardId)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/criteria" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] mb-2 transition-colors">
            <ArrowLeft size={16} />
            Quay lại Danh mục
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{standard.name}</h1>
          <p className="text-slate-500 mt-1">Danh sách tiêu chí thuộc {standard.name} (Năm {standard.year})</p>
        </div>
      </div>
      
      <ClientCriterionList initialCriteria={criteria} standardId={standardId} />
    </div>
  )
}
