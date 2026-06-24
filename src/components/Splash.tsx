'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

// Splash sekali per sesi tab (sessionStorage), durasi ~1.6s.
export function Splash() {
  const [show, setShow] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('presence_splash_shown')) return
    setShow(true)
    const t1 = setTimeout(() => setLeaving(true), 1400)
    const t2 = setTimeout(() => {
      sessionStorage.setItem('presence_splash_shown', '1')
      setShow(false)
    }, 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-400"
      style={{
        background: 'linear-gradient(160deg, #0f2c52 0%, #143a6b 50%, #15803d 120%)',
        opacity: leaving ? 0 : 1
      }}
    >
      <div className="animate-pop flex flex-col items-center">
        <div className="rounded-3xl bg-white/95 p-5 shadow-2xl">
          <Image src="/bmu-logo.svg" alt="BMU" width={96} height={96} priority />
        </div>
        <div className="mt-6 text-2xl font-bold tracking-tight text-white">Presence BMU</div>
        <div className="mt-1 text-sm text-white/80">Sistem Presensi Karyawan</div>
      </div>
      <div className="absolute bottom-10 flex items-center gap-2 text-white/70 text-xs">
        <span className="size-3 rounded-full border-2 border-white/40 border-t-white" style={{ animation: 'spinSlow 0.8s linear infinite' }} />
        Memuat...
      </div>
      <div className="absolute bottom-4 text-[10px] text-white/50">PT Brawijaya Multi Usaha</div>
    </div>
  )
}
