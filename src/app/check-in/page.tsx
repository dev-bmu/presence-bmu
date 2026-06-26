'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { AuthGate } from '@/components/AuthGate'
import { AppShell } from '@/components/AppShell'
import { CameraCapture } from '@/components/CameraCapture'
import { useMyLocations, useShiftToday, useCheckIn, useCheckOut, useAttendanceToday } from '@/lib/queries'
import { getPositionAsync } from '@/lib/photo'
import { MapPin, Loader2, Clock, AlertTriangle, CheckCircle2, LogIn, LogOut } from 'lucide-react'

const WFA_NOTES_MIN = 10

export default function CheckInPage() {
  return (
    <AuthGate>
      <AppShell title="Clock In / Clock Out">
        <Suspense fallback={<div className="text-center text-gray-500 py-6">Memuat...</div>}>
          <CheckInFlow />
        </Suspense>
      </AppShell>
    </AuthGate>
  )
}

function CheckInFlow() {
  const router = useRouter()
  const sp = useSearchParams()
  const isCheckout = sp.get('out') === '1'

  const { data: att } = useAttendanceToday()
  const { data: shiftData } = useShiftToday()
  const { data: locations = [] } = useMyLocations()
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()

  const [mode, setMode] = useState<'WFA' | 'WFO'>('WFO')
  const [notes, setNotes] = useState('')
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [pos, setPos] = useState<{ lat: number; lng: number; acc: number } | null>(null)
  const [posErr, setPosErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getPositionAsync()
      .then((p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }))
      .catch((e) => setPosErr(e?.message || 'Gagal ambil lokasi'))
  }, [])

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  const onCapture = (blob: Blob, url: string) => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoBlob(blob)
    setPhotoUrl(url)
  }
  const clearPhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoBlob(null)
    setPhotoUrl(null)
  }

  const nearest = useMemo(() => {
    if (!pos || !locations.length) return null
    let best = Infinity
    let bestName = ''
    let bestRadius = 0
    for (const l of locations) {
      const d = haversine(pos.lat, pos.lng, l.latitude, l.longitude)
      if (d < best) { best = d; bestName = l.name; bestRadius = l.radiusMeter }
    }
    return { distance: Math.round(best), name: bestName, withinRadius: best <= bestRadius, radius: bestRadius }
  }, [pos, locations])

  // Cek alasan button disabled — return null = OK, atau string alasan.
  const blocker: string | null = (() => {
    if (!pos) return 'Menunggu lokasi GPS...'
    if (!isCheckout) {
      if (!photoBlob) return 'Ambil foto dulu'
      if (mode === 'WFA' && notes.trim().length < WFA_NOTES_MIN) return `Notes WFA min ${WFA_NOTES_MIN} char (sekarang ${notes.trim().length})`
      if (mode === 'WFO' && !locations.length) return 'Tidak ada lokasi terdaftar — hubungi SDM'
      if (mode === 'WFO' && nearest && !nearest.withinRadius) return `Di luar radius (${nearest.distance}m / ${nearest.radius}m)`
    }
    return null
  })()
  const canSubmit = !blocker

  const submit = async () => {
    if (!pos) return
    setBusy(true)
    try {
      if (isCheckout) {
        await checkOut.mutateAsync({ lat: pos.lat, lng: pos.lng, photo: photoBlob ?? undefined })
        toast.success('Clock Out berhasil')
      } else {
        if (!photoBlob) return
        await checkIn.mutateAsync({
          mode,
          notes: mode === 'WFA' ? notes : undefined,
          lat: pos.lat,
          lng: pos.lng,
          photo: photoBlob
        })
        toast.success('Clock In berhasil')
      }
      router.replace('/')
    } catch (e: any) {
      toast.error(e?.response?.data?.errors || e?.response?.data?.error || 'Gagal mengirim')
    } finally {
      setBusy(false)
    }
  }

  if (isCheckout && !att?.checkInAt) {
    return <div className="text-center text-gray-500 py-6">Belum Clock In. Tidak bisa Clock Out.</div>
  }
  if (!isCheckout && att?.checkInAt) {
    return <div className="text-center text-gray-500 py-6">Sudah Clock In hari ini.</div>
  }

  return (
    <div className="space-y-4 pb-2">
      {shiftData?.shift && (
        <div className="card p-3.5 flex items-center gap-3">
          <span className="grid place-items-center size-9 rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)] shrink-0"><Clock className="size-4.5" /></span>
          <div className="text-sm">
            <span className="text-slate-500">Shift hari ini · </span>
            <strong className="text-slate-800">{shiftData.shift.name}</strong>
            <span className="text-slate-500"> {shiftData.shift.startTime}–{shiftData.shift.endTime}</span>
          </div>
        </div>
      )}

      {!isCheckout && (
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-2">Mode Kerja</label>
          <div className="grid grid-cols-2 gap-3">
            <ModeButton active={mode === 'WFO'} onClick={() => setMode('WFO')} title="WFO" subtitle="Di lokasi kantor" />
            <ModeButton active={mode === 'WFA'} onClick={() => setMode('WFA')} title="WFA" subtitle="Dari mana saja" />
          </div>
        </div>
      )}

      <LocationStatus pos={pos} posErr={posErr} nearest={!isCheckout && mode === 'WFO' ? nearest : null} />

      {!isCheckout && mode === 'WFA' && <NotesField value={notes} onChange={setNotes} />}

      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-2">Foto {isCheckout ? '(opsional)' : '(wajib)'}</label>
        <CameraCapture onCapture={onCapture} onClear={clearPhoto} previewUrl={photoUrl} />
      </div>

      {blocker && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <AlertTriangle className="size-4 shrink-0" /> {blocker}
        </div>
      )}

      <button
        disabled={!canSubmit || busy}
        onClick={submit}
        className="w-full flex items-center justify-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white font-semibold py-3.5 rounded-2xl shadow-md active:scale-[.99] transition disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ boxShadow: canSubmit ? '0 10px 24px -10px rgba(21,128,61,0.6)' : undefined }}
      >
        {isCheckout ? <LogOut className="size-5" /> : <LogIn className="size-5" />}
        {busy ? 'Mengirim...' : isCheckout ? 'Clock Out Sekarang' : 'Clock In Sekarang'}
      </button>
    </div>
  )
}

function ModeButton({ active, onClick, title, subtitle }: { active: boolean; onClick: () => void; title: string; subtitle: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-2xl border-2 text-left transition active:scale-[.98] ${
        active ? 'border-[var(--brand)] bg-[var(--brand-50)] shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {active && <CheckCircle2 className="absolute top-2.5 right-2.5 size-4 text-[var(--brand)]" />}
      <div className={`font-bold ${active ? 'text-[var(--brand-700)]' : 'text-slate-800'}`}>{title}</div>
      <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
    </button>
  )
}

function LocationStatus({
  pos,
  posErr,
  nearest
}: {
  pos: { lat: number; lng: number; acc: number } | null
  posErr: string | null
  nearest: { distance: number; name: string; withinRadius: boolean; radius: number } | null
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
        <span className="grid place-items-center size-8 rounded-lg bg-slate-100 text-slate-500"><MapPin className="size-4" /></span>
        Lokasi Anda
      </div>
      {posErr ? (
        <div className="text-red-600 text-sm">{posErr}</div>
      ) : !pos ? (
        <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Mengambil lokasi...</div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs text-slate-600">{pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}</div>
          <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">±{Math.round(pos.acc)}m</span>
        </div>
      )}
      {nearest && (
        <div className={`mt-3 flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${nearest.withinRadius ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {nearest.withinRadius ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
          <span>
            {nearest.withinRadius
              ? `Dalam radius ${nearest.name} (${nearest.distance}m/${nearest.radius}m)`
              : `Di luar radius. ${nearest.distance}m ke ${nearest.name} (maks ${nearest.radius}m)`}
          </span>
        </div>
      )}
    </div>
  )
}

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ok = value.trim().length >= WFA_NOTES_MIN
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 block mb-2">Alasan WFA</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition resize-none text-sm"
        placeholder="Jelaskan alasan bekerja dari luar kantor hari ini…"
      />
      <div className={`text-xs mt-1.5 ${ok ? 'text-green-600' : 'text-slate-400'}`}>{value.trim().length}/{WFA_NOTES_MIN} karakter {ok && '✓'}</div>
    </div>
  )
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
