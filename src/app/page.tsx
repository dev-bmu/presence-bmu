'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AuthGate } from '@/components/AuthGate'
import { AppShell } from '@/components/AppShell'
import { useShiftToday, useAttendanceToday, useMe } from '@/lib/queries'
import { Clock, CheckCircle2, AlertCircle, MapPin, Send, LogIn, LogOut } from 'lucide-react'
import type { Attendance } from '@/lib/types'

export default function HomePage() {
  return (
    <AuthGate>
      <AppShell title="Beranda">
        <Dashboard />
      </AppShell>
    </AuthGate>
  )
}

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

const HM = (d: Date) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
const SS = (d: Date) => d.toLocaleTimeString('id-ID', { second: '2-digit' }).padStart(2, '0')
const TIMEHM = (s: string) => new Date(s).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
const DATEID = (d: Date) => d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const greeting = (h: number) => (h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam')

function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function Dashboard() {
  const router = useRouter()
  const { data: me } = useMe()
  const { data: shiftData } = useShiftToday()
  const { data: att } = useAttendanceToday()
  const now = useNow()

  const shift = shiftData?.shift
  const clockedIn = !!att?.checkInAt
  const clockedOut = !!att?.checkOutAt

  const goClockIn = () => {
    if (clockedIn) return toast.warning('Anda sudah Clock In hari ini')
    router.push('/check-in')
  }
  const goClockOut = () => {
    if (!clockedIn) return toast.warning('Anda belum Clock In. Silakan Clock In dulu.')
    if (clockedOut) return toast.warning('Anda sudah Clock Out')
    router.push('/check-in?out=1')
  }

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="card overflow-hidden animate-fade-up" style={{ background: 'linear-gradient(135deg, #0f2c52 0%, #143a6b 60%, #16633f 130%)' }}>
        <div className="p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center size-12 rounded-2xl bg-white/15 text-white font-bold backdrop-blur">{initials(me?.name)}</div>
            <div className="min-w-0">
              <div className="text-xs text-white/70">{greeting(now.getHours())},</div>
              <div className="font-semibold leading-tight truncate">{me?.name ?? '...'}</div>
              <div className="text-[11px] text-white/60">{me?.unit?.name ?? me?.cluster?.name ?? '-'}{me?.jabatan ? ` • ${me.jabatan}` : ''}</div>
            </div>
          </div>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tabular-nums tracking-tight">{HM(now)}</span>
                <span className="text-lg font-semibold tabular-nums text-white/60">:{SS(now)}</span>
              </div>
              <div className="text-xs text-white/70 mt-0.5">{DATEID(now)}</div>
            </div>
            <StatusPill clockedIn={clockedIn} clockedOut={clockedOut} />
          </div>
        </div>
      </div>

      {/* Shift */}
      <div className="card p-4 flex items-center gap-3 animate-fade-up">
        <span className="grid place-items-center size-10 rounded-xl bg-(--brand-50) text-(--brand-700) shrink-0"><Clock className="size-5" /></span>
        <div className="flex-1">
          <div className="text-xs text-slate-400">Shift hari ini</div>
          {shift ? (
            <div className="font-semibold text-slate-800">{shift.name} <span className="font-normal text-slate-500 text-sm">· {shift.startTime}–{shift.endTime}</span></div>
          ) : (
            <div className="text-sm text-slate-400">Belum ada shift terjadwal</div>
          )}
        </div>
        {shift?.crossDay && <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Lintas hari</span>}
      </div>

      {/* Status detail (kalau sudah ada attendance) */}
      {att && <TodayStatus att={att} />}

      {/* Clock In / Out */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up">
        <ClockCard kind="in" done={clockedIn} time={att?.checkInAt ? TIMEHM(att.checkInAt) : undefined} onClick={goClockIn} />
        <ClockCard kind="out" done={clockedOut} time={att?.checkOutAt ? TIMEHM(att.checkOutAt) : undefined} onClick={goClockOut} />
      </div>
    </div>
  )
}

function StatusPill({ clockedIn, clockedOut }: { clockedIn: boolean; clockedOut: boolean }) {
  const label = clockedOut ? 'Selesai' : clockedIn ? 'Sedang bekerja' : 'Belum hadir'
  const dot = clockedOut ? 'bg-slate-300' : clockedIn ? 'bg-emerald-400' : 'bg-amber-400'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 border border-white/15 px-3 py-1.5 rounded-full backdrop-blur">
      <span className={`size-2 rounded-full ${dot}`} /> {label}
    </span>
  )
}

function ClockCard({
  kind,
  done,
  time,
  disabledLook,
  onClick
}: {
  kind: 'in' | 'out'
  done: boolean
  time?: string
  disabledLook?: boolean
  onClick: () => void
}) {
  const isIn = kind === 'in'
  const Icon = isIn ? LogIn : LogOut
  const accent = isIn ? '#15803d' : '#0f2c52'

  return (
    <button onClick={onClick} className="card p-4 text-left active:scale-[.98] transition relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span
          className="grid place-items-center size-11 rounded-xl text-white"
          style={{ background: done ? '#94a3b8' : disabledLook ? '#cbd5e1' : accent }}
        >
          {done ? <CheckCircle2 className="size-6" /> : <Icon className="size-6" />}
        </span>
        {done && <CheckCircle2 className="size-4 text-emerald-500" />}
      </div>
      <div className="mt-3 font-semibold text-slate-800">{isIn ? 'Clock In' : 'Clock Out'}</div>
      {done && time ? (
        <div className="text-xs text-emerald-600 font-medium mt-0.5">Tercatat {time}</div>
      ) : (
        <div className="text-xs text-slate-400 mt-0.5">{isIn ? 'Mulai kerja' : 'Akhiri kerja'}</div>
      )}
    </button>
  )
}

function TodayStatus({ att }: { att: Attendance }) {
  return (
    <div className="card p-4 animate-fade-up">
      <div className="text-xs text-slate-400 mb-2">Detail presensi</div>
      <div className="flex flex-wrap gap-2">
        <Chip icon={<Send className="size-3.5" />} label={att.mode} tone="brand" />
        {att.isLate && <Chip icon={<AlertCircle className="size-3.5" />} label="Telat" tone="amber" />}
        {att.workLocation && <Chip icon={<MapPin className="size-3.5" />} label={att.workLocation.name} tone="slate" />}
        {att.mode === 'WFA' && (
          <Chip label={`Approval ${att.approvalStatus}`} tone={att.approvalStatus === 'APPROVED' ? 'green' : att.approvalStatus === 'REJECTED' ? 'red' : 'amber'} />
        )}
      </div>
      {att.notes && <div className="text-xs text-slate-500 italic mt-2">&quot;{att.notes}&quot;</div>}
    </div>
  )
}

function Chip({ icon, label, tone }: { icon?: React.ReactNode; label: string; tone: 'brand' | 'amber' | 'slate' | 'green' | 'red' }) {
  const map = {
    brand: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700'
  }
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${map[tone]}`}>{icon}{label}</span>
}
