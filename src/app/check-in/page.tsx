'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { AuthGate } from '@/components/AuthGate'
import { AppShell } from '@/components/AppShell'
import { CameraCapture } from '@/components/CameraCapture'
import { useMyLocations, useShiftToday, useCheckIn, useCheckOut, useAttendanceToday } from '@/lib/queries'
import { getPositionAsync } from '@/lib/photo'
import { MapPin, Loader2 } from 'lucide-react'

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
    <div className="space-y-4">
      {shiftData?.shift && (
        <div className="bg-green-50 text-green-900 p-3 rounded text-sm">
          Shift: <strong>{shiftData.shift.name}</strong> ({shiftData.shift.startTime}–{shiftData.shift.endTime})
        </div>
      )}

      {!isCheckout && (
        <div>
          <label className="text-sm font-medium block mb-2">Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <ModeButton active={mode === 'WFO'} onClick={() => setMode('WFO')} title="WFO" subtitle="Di lokasi" />
            <ModeButton active={mode === 'WFA'} onClick={() => setMode('WFA')} title="WFA" subtitle="Dari mana saja" />
          </div>
        </div>
      )}

      <LocationStatus pos={pos} posErr={posErr} nearest={!isCheckout && mode === 'WFO' ? nearest : null} />

      {!isCheckout && mode === 'WFA' && (
        <NotesField value={notes} onChange={setNotes} />
      )}

      <div>
        <label className="text-sm font-medium block mb-2">Foto {isCheckout ? '(opsional)' : '(wajib)'}</label>
        <CameraCapture onCapture={onCapture} onClear={clearPhoto} previewUrl={photoUrl} />
      </div>

      {blocker && <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">⚠ {blocker}</div>}

      <button
        disabled={!canSubmit || busy}
        onClick={submit}
        className="w-full bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white font-medium py-3 rounded disabled:opacity-50 sticky bottom-20"
      >
        {busy ? 'Mengirim...' : isCheckout ? 'Clock Out Sekarang' : 'Clock In Sekarang'}
      </button>
    </div>
  )
}

function ModeButton({ active, onClick, title, subtitle }: { active: boolean; onClick: () => void; title: string; subtitle: string }) {
  return (
    <button onClick={onClick} className={`p-3 rounded border-2 ${active ? 'border-[var(--brand)] bg-green-50' : 'border-gray-200'}`}>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
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
    <div className="bg-white p-3 rounded shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium mb-1"><MapPin className="size-4" /> Lokasi</div>
      {posErr ? (
        <div className="text-red-600 text-sm">{posErr}</div>
      ) : !pos ? (
        <div className="text-gray-500 text-sm flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Mengambil lokasi...</div>
      ) : (
        <div className="text-xs text-gray-600">
          <div className="font-mono">{pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}</div>
          <div>Akurasi: {Math.round(pos.acc)}m</div>
        </div>
      )}
      {nearest && (
        <div className={`mt-2 text-sm ${nearest.withinRadius ? 'text-green-600' : 'text-red-600'}`}>
          {nearest.withinRadius
            ? `Dalam radius ${nearest.name} (${nearest.distance}m / ${nearest.radius}m)`
            : `Di luar radius. Jarak ${nearest.distance}m ke ${nearest.name} (max ${nearest.radius}m)`}
        </div>
      )}
    </div>
  )
}

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">Notes (min {WFA_NOTES_MIN} karakter)</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Jelaskan alasan WFA hari ini..."
      />
      <div className="text-xs text-gray-400 mt-1">{value.trim().length}/{WFA_NOTES_MIN} karakter</div>
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
