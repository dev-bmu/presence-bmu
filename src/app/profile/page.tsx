'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { AuthGate } from '@/components/AuthGate'
import { AppShell } from '@/components/AppShell'
import { useMe } from '@/lib/queries'
import { changePassword } from '@/lib/services'
import { clearTokens } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Mail, Building2, Layers, BadgeCheck, Eye, EyeOff, KeyRound, Lock, Bell, BellOff } from 'lucide-react'
import { getReminderState, enableReminder, disableReminder, sendTestReminder } from '@/lib/push'

export default function ProfilePage() {
  return (
    <AuthGate>
      <AppShell title="Profil">
        <Profile />
      </AppShell>
    </AuthGate>
  )
}

function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function Profile() {
  const { data: me } = useMe()
  const router = useRouter()
  const [oldP, setOldP] = useState('')
  const [newP, setNewP] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [busy, setBusy] = useState(false)

  const placement = me?.unit?.name
    ? { label: 'Unit', value: me.unit.name, icon: <Building2 className="size-4" /> }
    : { label: 'Cluster', value: me?.cluster?.name ?? '-', icon: <Layers className="size-4" /> }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newP.length < 8) return toast.error('Password baru minimal 8 karakter')
    setBusy(true)
    try {
      await changePassword(oldP, newP)
      toast.success('Password berhasil diganti. Silakan login ulang.')
      clearTokens()
      setTimeout(() => router.replace('/login'), 800)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.response?.data?.errors || 'Gagal ganti password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {me && (
        <div className="card overflow-hidden animate-fade-up">
          <div className="flex items-center gap-3 p-5" style={{ background: 'linear-gradient(135deg, #0f2c52, #143a6b)' }}>
            <div className="grid place-items-center size-14 rounded-2xl bg-white/15 text-white text-lg font-bold backdrop-blur">{initials(me.name)}</div>
            <div className="min-w-0">
              <div className="text-white font-semibold truncate">{me.name}</div>
              <div className="text-white/70 text-xs">{me.jabatan || me.employmentStatus}</div>
            </div>
          </div>
          <div className="p-2">
            <InfoRow icon={<Mail className="size-4" />} label="Email" value={me.email} />
            <InfoRow icon={placement.icon} label={placement.label} value={placement.value} />
            <InfoRow icon={<BadgeCheck className="size-4" />} label="Status" value={me.employmentStatus} last />
          </div>
        </div>
      )}

      <ReminderToggle />

      <div className="card p-5 animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <span className="grid place-items-center size-9 rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]"><KeyRound className="size-4" /></span>
          <div>
            <h3 className="font-semibold text-slate-800 leading-tight">Ganti Password</h3>
            <p className="text-xs text-slate-400">Amankan akun Anda secara berkala</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <PassInput label="Password Lama" value={oldP} onChange={setOldP} show={showOld} onToggle={() => setShowOld((s) => !s)} />
          <PassInput label="Password Baru" hint="min 8 karakter" value={newP} onChange={setNewP} show={showNew} onToggle={() => setShowNew((s) => !s)} />
          <button
            disabled={busy}
            type="submit"
            className="w-full bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white font-semibold py-3 rounded-xl shadow active:scale-[.99] transition disabled:opacity-50"
          >
            {busy ? 'Mengirim...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ReminderToggle() {
  const [state, setState] = useState<'on' | 'off' | 'denied' | 'unsupported' | 'loading'>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getReminderState().then(setState).catch(() => setState('unsupported'))
  }, [])

  const toggle = async () => {
    setBusy(true)
    try {
      if (state === 'on') {
        await disableReminder()
        setState('off')
        toast.success('Pengingat dimatikan')
      } else {
        await enableReminder()
        setState('on')
        toast.success('Pengingat diaktifkan')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal mengatur pengingat')
      setState(await getReminderState())
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    try {
      await sendTestReminder()
      toast.success('Notif uji dikirim — cek notifikasi HP/perangkat')
    } catch (e: any) {
      toast.error(e?.response?.data?.errors || e?.response?.data?.error || 'Gagal kirim notif uji')
    }
  }

  const on = state === 'on'
  const disabled = busy || state === 'loading' || state === 'unsupported' || state === 'denied'

  return (
    <div className="card p-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <span className={`grid place-items-center size-10 rounded-xl ${on ? 'bg-[var(--brand-50)] text-[var(--brand-700)]' : 'bg-slate-100 text-slate-400'}`}>
          {on ? <Bell className="size-5" /> : <BellOff className="size-5" />}
        </span>
        <div className="flex-1">
          <div className="font-semibold text-slate-800 text-sm">Pengingat Clock In/Out</div>
          <div className="text-xs text-slate-400">
            {state === 'unsupported' ? 'Tidak didukung browser ini' : state === 'denied' ? 'Izin notifikasi diblokir di setelan browser' : 'Notifikasi 5 menit sebelum jadwal'}
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={disabled}
          className={`relative w-12 h-7 rounded-full transition ${on ? 'bg-[var(--brand)]' : 'bg-slate-300'} disabled:opacity-50`}
        >
          <span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${on ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
      {on && (
        <button onClick={test} className="mt-3 w-full text-sm font-medium text-[var(--brand-700)] border border-[var(--brand-50)] bg-[var(--brand-50)] rounded-xl py-2 active:scale-[.99] transition">
          Kirim Notifikasi Uji
        </button>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value, last }: { icon: React.ReactNode; label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-3 ${last ? '' : 'border-b border-slate-100'}`}>
      <span className="grid place-items-center size-9 rounded-xl bg-slate-100 text-slate-500 shrink-0">{icon}</span>
      <span className="text-sm text-slate-500 w-20 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right ml-auto truncate">{value}</span>
    </div>
  )
}

function PassInput({
  label,
  hint,
  value,
  onChange,
  show,
  onToggle
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">
        {label} {hint && <span className="text-slate-400 font-normal">({hint})</span>}
      </label>
      <div className="relative mt-1.5">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition"
        />
        <button type="button" onClick={onToggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}
