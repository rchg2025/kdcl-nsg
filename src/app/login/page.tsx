"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ShieldCheck, User, Lock, Loader2, Eye, EyeOff, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Forgot Password State
  const [viewMode, setViewMode] = useState<"LOGIN" | "FORGOT_EMAIL" | "FORGOT_OTP">("LOGIN")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  
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

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra")
      
      setViewMode("FORGOT_OTP")
      setSuccessMsg(data.message)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccessMsg("")
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra")
      
      setSuccessMsg("Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.")
      setViewMode("LOGIN")
      setPassword("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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
            <h1 className="text-2xl font-bold text-center text-[var(--foreground)] leading-tight">
              <span className="block text-3xl mb-1 bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] via-pink-500 to-blue-500 animate-gradient-text">Hệ thống Minh chứng</span>
              <span className="block text-xl opacity-90 uppercase tracking-wide">Kiểm định chất lượng SỐ</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm font-medium">Trường Cao đẳng Bách khoa Nam Sài Gòn</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium text-center border border-red-100 dark:border-red-800/30">
              {error}
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium text-center border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> {successMsg}
            </div>
          )}

          {viewMode === "LOGIN" && (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-5 animate-in fade-in duration-300">
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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Mật khẩu</label>
                <button type="button" onClick={() => setViewMode("FORGOT_EMAIL")} className="text-xs font-semibold text-[var(--primary)] hover:underline">
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-[var(--input)] border-transparent focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 rounded-xl text-sm transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
          )}

          {viewMode === "FORGOT_EMAIL" && (
            <form onSubmit={handleForgotEmailSubmit} className="relative z-10 space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="mb-2 text-center">
                <h2 className="text-lg font-bold text-[var(--foreground)]">Khôi phục mật khẩu</h2>
                <p className="text-sm text-slate-500 mt-1">Nhập email tài khoản của bạn để nhận mã xác nhận OTP.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Email khôi phục</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[var(--input)] border-transparent focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 rounded-xl text-sm transition-all outline-none"
                    placeholder="email@domain.com"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setViewMode("LOGIN")} className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all flex items-center justify-center">
                  <ArrowLeft size={18} />
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[var(--primary)]/30 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Gửi mã OTP"}
                </button>
              </div>
            </form>
          )}

          {viewMode === "FORGOT_OTP" && (
            <form onSubmit={handleResetPasswordSubmit} className="relative z-10 space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="mb-2 text-center">
                <h2 className="text-lg font-bold text-[var(--foreground)]">Nhập mã xác nhận</h2>
                <p className="text-sm text-slate-500 mt-1">Mã OTP đã được gửi đến <strong>{email}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Mã OTP (6 số)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--input)] border-transparent focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 rounded-xl text-sm transition-all outline-none text-center font-bold tracking-widest text-lg"
                  placeholder="------"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-[var(--input)] border-transparent focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 rounded-xl text-sm transition-all outline-none"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setViewMode("LOGIN")} className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all flex items-center justify-center">
                  <ArrowLeft size={18} />
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[var(--primary)]/30 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Đặt mật khẩu mới"}
                </button>
              </div>
            </form>
          )}
        </div>
        
        <p className="text-center text-xs text-slate-500 mt-8 font-medium">
          &copy; {new Date().getFullYear()} Nam Sai Gon Polytechnic College. All rights reserved.
        </p>
      </div>
    </div>
  )
}
