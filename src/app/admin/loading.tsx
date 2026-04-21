import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 w-full h-full min-h-[50vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
        <Loader2 size={48} className="text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse">
        Đang tải dữ liệu...
      </p>
    </div>
  );
}
