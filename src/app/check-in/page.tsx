'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { AuthGate } from '@/components/AuthGate'
import { AppShell } from '@/components/AppShell'
import { CameraCapture } from '@/components/CameraCapture'
import LocationMap from '@/components/LocationMap'
import { useMyLocations, useShiftToday, useCheckIn, useCheckOut, useAttendanceToday } from '@/lib/queries'
import { getPositionAsync } from '@/lib/photo'
import { MapPin, Loader2, Clock, AlertTriangle, CheckCircle2, RefreshCw, ArrowRight, ArrowLeft, Camera } from 'lucide-react'

const WFA_NOTES_MIN = 10
const ACC_BONUS_CAP = 50

export default function CheckInPage() {
  return (
    <AuthGate>
      <AppShell title="Clock In / Clock Out">
        <Suspense fallback={<div className="text-center text-slate-400 py-6">Memuat...</div>}>
          <Flow />
        </Suspense>
      </AppShell>
    </AuthGate>
  )
}

type Pos = { lat: number; lng: number; acc: number }

function Flow() {
  const router = useRouter()
  const sp = useSearchParams()
  const isCheckout = sp.get('out') === '1'

  const { data: att } = useAttendanceToday()
  const { data: shiftData } = useShiftToday()
  const { data: locations = [] } = useMyLocations()
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()

  const [step, setStep] = useState<1 | 2>(1)
  const [pos, setPos] = useState<Pos | null>(null)
  const [posErr, setPosErr] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [notes, setNotes] = useState('')
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const getPos = () => {
    setRefreshing(true)
    setPosErr(null)
    getPositionAsync()
      .then((p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }))
      .catch((e) => setPosErr(e?.message || 'Gagal ambil lokasi'))
      .finally(() => setRefreshing(false))
  }
  useEffect(getPos, [])
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  const nearest = useMemo(() => {
    if (!pos || !locations.length) return null
    let best = Infinity, name = '', radius = 0
    for (const l of locations) {
      const d = haversine(pos.lat, pos.lng, l.latitude, l.longitude)
      if (d < best) { best = d; name = l.name; radius = l.radiusMeter }
    }
    const bonus = Math.min(pos.acc, ACC_BONUS_CAP)
    return { distance: Math.round(best), name, radius, withinRadius: best <= radius + bonus }
  }, [pos, locations])

  // Mode otomatis: dalam radius → WFO, luar → WFA
  const mode: 'WFO' | 'WFA' = nearest?.withinRadius ? 'WFO' : 'WFA'
  const needNotes = !isCheckout && mode === 'WFA'
  const notesOk = !needNotes || notes.trim().length >= WFA_NOTES_MIN

  const onCapture = (blob: Blob, url: string) => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoBlob(blob); setPhotoUrl(url)
  }
  const clearPhoto = () => { if (photoUrl) URL.revokeObjectURL(photoUrl); setPhotoBlob(null); setPhotoUrl(null) }

  const step1Ok = !!pos && notesOk
  const step2Ok = isCheckout ? true : !!photoBlob

  const submit = async () => {
    if (!pos) return
    setBusy(true)
    try {
      if (isCheckout) {
        await checkOut.mutateAsync({ lat: pos.lat, lng: pos.lng, accuracy: pos.acc, photo: photoBlob ?? undefined })
        toast.success('Clock Out berhasil')
      } else {
        if (!photoBlob) return
        await checkIn.mutateAsync({ mode, notes: needNotes ? notes : undefined, lat: pos.lat, lng: pos.lng, accuracy: pos.acc, photo: photoBlob })
        toast.success('Clock In berhasil')
      }
      router.replace('/')
    } catch (e: any) {
      toast.error(e?.response?.data?.errors || e?.response?.data?.error || 'Gagal mengirim')
    } finally {
      setBusy(false)
    }
  }

  if (isCheckout && !att?.checkInAt) return <div className="text-center text-slate-400 py-6">Belum Clock In. Tidak bisa Clock Out.</div>
  if (!isCheckout && att?.checkInAt) return <div className="text-center text-slate-400 py-6">Sudah Clock In hari ini.</div>

  return (
    <div className="space-y-4 pb-2">
      <StepHeader step={step} isCheckout={isCheckout} shift={shiftData?.shift} />

      {step === 1 ? (
        <>
          <div className="card p-3">
            {pos ? (
              <LocationMap lat={pos.lat} lng={pos.lng} accuracy={pos.acc} locations={locations} />
            ) : (
              <div className="h-[240px] rounded-2xl bg-slate-100 grid place-items-center text-slate-400 text-sm">
                {posErr ? posErr : <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Mengambil lokasi…</span>}
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-slate-500">
                {pos ? <>Akurasi GPS ±{Math.round(pos.acc)}m</> : 'Menunggu GPS…'}
              </div>
              <button onClick={getPos} disabled={refreshing} className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-700)] disabled:opacity-50">
                <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} /> Perbarui
              </button>
            </div>
          </div>

          {nearest && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 ${nearest.withinRadius ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              {nearest.withinRadius ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
              <span>
                {nearest.withinRadius
                  ? `Anda di dalam area ${nearest.name} → tercatat WFO`
                  : `Anda di luar area kantor (${nearest.distance}m) → tercatat WFA, wajib isi alasan`}
              </span>
            </div>
          )}

          {needNotes && (
            <div className="card p-4">
              <label className="text-sm font-semibold text-slate-700 block mb-2">Alasan WFA (Bekerja dari luar)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition resize-none text-sm"
                placeholder="Jelaskan alasan bekerja dari luar kantor hari ini…"
              />
              <div className={`text-xs mt-1.5 ${notesOk ? 'text-green-600' : 'text-slate-400'}`}>{notes.trim().length}/{WFA_NOTES_MIN} karakter {notesOk && '✓'}</div>
            </div>
          )}

          <button
            disabled={!step1Ok}
            onClick={() => setStep(2)}
            className="w-full flex items-center justify-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white font-semibold py-3.5 rounded-2xl shadow-md active:scale-[.99] transition disabled:opacity-40"
          >
            Lanjut <ArrowRight className="size-5" />
          </button>
        </>
      ) : (
        <>
          {/* Ringkasan mode terkunci dari step 1 */}
          <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 ${mode === 'WFO' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
            <MapPin className="size-4 shrink-0" />
            <span>Mode presensi: <strong>{mode}</strong>{mode === 'WFO' && nearest ? ` · ${nearest.name}` : ''}</span>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2 flex items-center gap-1.5"><Camera className="size-4" /> Foto {isCheckout ? '(opsional)' : 'Selfie (wajib)'}</label>
            <CameraCapture onCapture={onCapture} onClear={clearPhoto} previewUrl={photoUrl} />
          </div>

          {!step2Ok && <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5"><AlertTriangle className="size-4 shrink-0" /> Ambil foto dulu</div>}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-medium active:scale-[.99] transition">
              <ArrowLeft className="size-5" /> Kembali
            </button>
            <button
              disabled={!step2Ok || busy}
              onClick={submit}
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white font-semibold py-3.5 rounded-2xl shadow-md active:scale-[.99] transition disabled:opacity-40"
              style={{ boxShadow: step2Ok ? '0 10px 24px -10px rgba(21,128,61,0.6)' : undefined }}
            >
              {busy ? 'Mengirim...' : isCheckout ? 'Clock Out Sekarang' : 'Clock In Sekarang'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function StepHeader({ step, isCheckout, shift }: { step: 1 | 2; isCheckout: boolean; shift?: { name: string; startTime: string; endTime: string } | null }) {
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center size-9 rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)] shrink-0"><Clock className="size-4.5" /></span>
        <div className="flex-1 text-sm">
          {shift ? (
            <><span className="text-slate-500">Shift · </span><strong className="text-slate-800">{shift.name}</strong><span className="text-slate-500"> {shift.startTime}–{shift.endTime}</span></>
          ) : (
            <span className="text-slate-400">Tidak ada shift terjadwal</span>
          )}
        </div>
        <span className="text-[11px] font-medium text-slate-400">Langkah {step}/2</span>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <span className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-[var(--brand)]' : 'bg-slate-200'}`} />
        <span className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-[var(--brand)]' : 'bg-slate-200'}`} />
      </div>
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
