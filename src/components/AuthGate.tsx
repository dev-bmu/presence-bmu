'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthed } from '@/lib/auth'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isAuthed()) {
      router.replace('/login')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) return <div className="p-6 text-center text-gray-500">Memuat...</div>
  return <>{children}</>
}
