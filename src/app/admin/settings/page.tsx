import { getSettings } from "@/actions/setting"
import ClientSettings from "./ClientSettings"

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Cài đặt Hệ thống Lõi</h1>
        <p className="text-slate-500 mt-1">Cấu hình kết nối APIs ngoại vi (Storage, Mail Server,...)</p>
      </div>

      <ClientSettings initialData={settings} />
    </div>
  )
}
