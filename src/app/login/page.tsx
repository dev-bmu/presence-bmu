'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { login as svcLogin } from '@/lib/services'
import { isAuthed, setTokens } from '@/lib/auth'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isAuthed()) router.replace('/')
  }, [router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setBusy(true)
    try {
      const r = await svcLogin(email, password)
      setTokens(r.accessToken, r.refreshToken)
      toast.success(`Selamat datang, ${r.employee.name}`)
      router.replace('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.response?.data?.errors || 'Login gagal')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0">
        <Image src="/bg-bmu.png" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(150deg, rgba(12,36,68,0.45), rgba(15,44,82,0.32) 50%, rgba(6,40,30,0.45))' }} />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-4xl glass-dark overflow-hidden animate-fade-up">
        <div className="grid md:grid-cols-2">
          {/* Left brand */}
          <div className="p-8 md:p-10 md:border-r border-white/10 flex flex-col">
            <div className="inline-flex w-fit rounded-2xl bg-white/95 p-3 shadow-lg">
              <Image src="/bmu-logo.svg" alt="BMU" width={52} height={52} priority />
            </div>
            <h1 className="mt-6 text-3xl font-bold text-white tracking-tight">Presence BMU</h1>
            <p className="mt-1.5 text-sm text-white/70">Sistem Presensi Karyawan — PT Brawijaya Multi Usaha</p>

            <div className="mt-8 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4">
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">🛡 INFORMASI</div>
              <p className="mt-1.5 text-sm text-white/75 leading-relaxed">
                Gunakan email & password yang diberikan oleh SDM unit Anda. Pastikan GPS & kamera aktif saat melakukan presensi.
              </p>
            </div>
            <div className="mt-auto pt-8 text-[11px] text-white/40">© {new Date().getFullYear()} PT Brawijaya Multi Usaha</div>
          </div>

          {/* Right form */}
          <div className="p-8 md:p-10">
            <div className="text-xs font-semibold tracking-widest text-white/60 uppercase">Masuk dengan Email & Password</div>
            <form onSubmit={submit} className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-white/85">Alamat Email</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-white/40" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="glass-input w-full pl-11 pr-3.5 py-3 rounded-xl transition"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/85">Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-white/40" />
                  <input
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input w-full pl-11 pr-11 py-3 rounded-xl transition"
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50">
                    {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>
              <button
                disabled={busy}
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white font-semibold py-3.5 rounded-xl shadow-lg active:scale-[.99] transition disabled:opacity-50"
              >
                {busy ? 'Memproses...' : 'Masuk'} <ArrowRight className="size-5" />
              </button>
              <p className="text-xs text-white/45 text-center pt-1">Lupa password? Hubungi SDM unit Anda.</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
