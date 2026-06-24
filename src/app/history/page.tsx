'use client'

import { useState } from 'react'
import { AuthGate } from '@/components/AuthGate'
import { AppShell } from '@/components/AppShell'
import { useHistory } from '@/lib/queries'

export default function HistoryPage() {
  return (
    <AuthGate>
      <AppShell title="Riwayat Presensi">
        <History />
      </AppShell>
    </AuthGate>
  )
}

function History() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useHistory(undefined, undefined, page)

  return (
    <div className="space-y-3">
      {isLoading && <div className="text-center text-gray-500 py-6">Memuat...</div>}
      {!isLoading && (data?.attendances.length ?? 0) === 0 && (
        <div className="text-center text-gray-400 py-12">Belum ada presensi</div>
      )}
      {data?.attendances.map((a) => (
        <div key={a.id} className="card p-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold">{new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div className="text-xs text-gray-500 mt-1">
                {a.mode} • {new Date(a.checkInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                {a.checkOutAt && ` – ${new Date(a.checkOutAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
              </div>
            </div>
            <StatusBadge a={a} />
          </div>
          {a.notes && <div className="mt-2 text-xs text-gray-500 italic">"{a.notes}"</div>}
          {a.approvalNote && <div className="mt-1 text-xs text-red-600">Catatan: {a.approvalNote}</div>}
        </div>
      ))}

      {data && data.pagination.totalPage > 1 && (
        <div className="flex justify-between items-center pt-3">
          <span className="text-xs text-gray-500">Halaman {page}/{data.pagination.totalPage}</span>
          <div className="space-x-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">←</button>
            <button disabled={page >= data.pagination.totalPage} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">→</button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ a }: { a: { isLate: boolean; mode: string; approvalStatus: string } }) {
  if (a.mode === 'WFA') {
    const c = a.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
              a.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
    return <span className={`text-xs px-2 py-1 rounded ${c}`}>{a.approvalStatus}</span>
  }
  if (a.isLate) return <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">Telat</span>
  return <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Hadir</span>
}
