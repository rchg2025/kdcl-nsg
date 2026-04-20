import { getMyProfile } from "@/actions/profile"
import ClientProfile from "./ClientProfile"

export default async function ProfilePage() {
  const user = await getMyProfile()
  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Thông tin Cá nhân</h1>
      <ClientProfile user={user as any} />
    </div>
  )
}
