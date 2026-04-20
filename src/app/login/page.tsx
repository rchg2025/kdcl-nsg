"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ShieldCheck, User, Lock, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    })

    if (res?.error) {
      setError("Email hoặc Mật khẩu không chính xác")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--background)] to-[var(--border)] p-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)] rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10 flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-bold text-center text-[var(--foreground)]">Hệ thống KDCL</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm font-medium">Cao đẳng Bách khoa Nam Sài Gòn</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium text-center border border-red-100 dark:border-red-800/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Tài khoản</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--input)] border-transparent focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 rounded-xl text-sm transition-all outline-none"
                  placeholder="admin@localhost.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--input)] border-transparent focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 rounded-xl text-sm transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[var(--primary)]/30 flex items-center justify-center mt-4 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Đăng nhập
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-500 mt-8 font-medium">
          &copy; {new Date().getFullYear()} Nam Sai Gon Polytechnic College. All rights reserved.
        </p>
      </div>
    </div>
  )
}
