'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, RotateCw, X } from 'lucide-react'

type Props = {
  onCapture: (blob: Blob, previewUrl: string) => void
  onClear?: () => void
  previewUrl?: string | null
}

type Facing = 'environment' | 'user'

async function openStream(facing: Facing): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Browser tidak mendukung kamera')
  // Coba sesuai preferensi dulu; kalau gagal (mis. laptop tidak punya kamera environment),
  // fallback ke {video: true} biar dapat kamera apa pun yang tersedia.
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    })
  } catch (e) {
    return await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  }
}

function explainError(e: unknown): string {
  const err = e as { name?: string; message?: string }
  if (err?.name === 'NotAllowedError') return 'Akses kamera ditolak. Izinkan di setting browser.'
  if (err?.name === 'NotFoundError') return 'Kamera tidak ditemukan'
  if (err?.name === 'NotReadableError') return 'Kamera dipakai aplikasi lain'
  if (err?.name === 'OverconstrainedError') return 'Tidak ada kamera yang cocok'
  return err?.message || 'Gagal akses kamera'
}

export function CameraCapture({ onCapture, onClear, previewUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facing, setFacing] = useState<Facing>('environment')
  const [err, setErr] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [requested, setRequested] = useState(false) // user sudah klik "Nyalakan Kamera"

  // Buka stream tiap kali requested / facing berubah.
  useEffect(() => {
    if (!requested || previewUrl) return
    let canceled = false
    let local: MediaStream | null = null

    setStarting(true)
    setErr(null)
    openStream(facing)
      .then((s) => {
        if (canceled) { s.getTracks().forEach((t) => t.stop()); return }
        local = s
        setStream(s)
      })
      .catch((e) => { if (!canceled) setErr(explainError(e)) })
      .finally(() => { if (!canceled) setStarting(false) })

    return () => {
      canceled = true
      local?.getTracks().forEach((t) => t.stop())
    }
  }, [requested, facing, previewUrl])

  // Bind stream ke <video> kapan pun salah satu siap.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !stream) return
    v.srcObject = stream
    const tryPlay = () => v.play().catch(() => {})
    if (v.readyState >= 1) tryPlay()
    else v.onloadedmetadata = tryPlay
    return () => { v.onloadedmetadata = null }
  }, [stream])

  // Cleanup global on unmount.
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopAll = () => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setRequested(false)
  }

  const flip = () => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))

  const capture = () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(v, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        stream?.getTracks().forEach((t) => t.stop())
        setStream(null)
        setRequested(false)
        onCapture(blob, url)
      },
      'image/jpeg',
      0.85
    )
  }

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    onClear?.()
    setRequested(true)
  }

  if (previewUrl) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="capture" className="w-full rounded" />
        <button
          type="button"
          onClick={retake}
          className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1"
        >
          <RotateCw className="size-3.5" /> Ambil ulang
        </button>
      </div>
    )
  }

  if (!requested) {
    return (
      <button
        type="button"
        onClick={() => setRequested(true)}
        className="w-full border-2 border-dashed border-gray-300 rounded p-6 flex flex-col items-center text-gray-500 hover:bg-gray-50"
      >
        <Camera className="size-8 mb-1" />
        Nyalakan Kamera
      </button>
    )
  }

  if (err) {
    return (
      <div className="border-2 border-dashed border-red-300 rounded p-4 text-center">
        <div className="text-red-600 text-sm mb-2">{err}</div>
        <button
          type="button"
          onClick={() => { setErr(null); setRequested(false); setTimeout(() => setRequested(true), 50) }}
          className="text-blue-600 text-sm underline"
        >
          Coba lagi
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded bg-black"
        style={{ aspectRatio: '4/3' }}
      />
      {(starting || !stream) && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-black/40">
          Membuka kamera...
        </div>
      )}
      <div className="absolute top-2 right-2 flex gap-1">
        <button type="button" onClick={flip} className="bg-black/60 text-white p-1.5 rounded" title="Putar kamera">
          <RotateCw className="size-4" />
        </button>
        <button type="button" onClick={stopAll} className="bg-black/60 text-white p-1.5 rounded" title="Matikan kamera">
          <X className="size-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={capture}
        disabled={!stream}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white border-4 border-blue-600 rounded-full size-14 flex items-center justify-center disabled:opacity-50"
        aria-label="Capture"
      >
        <div className="size-10 rounded-full bg-blue-600" />
      </button>
    </div>
  )
}
