export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Cài đặt Hệ thống</h1>
        <p className="text-slate-500 mt-1">Cấu hình tham số chung của phần mềm đánh giá</p>
      </div>

      <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[50vh] border border-slate-200 dark:border-slate-800 shadow-sm">
         <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Tính năng đang trong giai đoạn phát triển</h2>
         <p className="text-slate-500 max-w-md">Khu vực cấu hình Chữ ký, Biểu mẫu PDF, và Cơ sở dữ liệu sẽ được ra mắt trong bản cập nhật V5 tiếp theo.</p>
      </div>
    </div>
  )
}
