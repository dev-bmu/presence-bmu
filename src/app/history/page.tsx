'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtTime(d: string | null) {
  return d ? new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'
}

function History() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useHistory(undefined, undefined, page)

  return (
    <div className="space-y-2">
      {isLoading && <div className="text-center text-gray-500 py-6">Memuat...</div>}
      {!isLoading && (data?.attendances.length ?? 0) === 0 && (
        <div className="text-center text-gray-400 py-12">Belum ada presensi</div>
      )}
      {data?.attendances.map((a) => {
        const inCls = a.isLate ? 'text-red-600 font-semibold' : 'font-semibold'
        const outCls = a.isEarlyLeave ? 'text-red-600 font-semibold' : 'font-semibold'
        return (
          <div key={a.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-[15px]">{fmtDate(a.date)}</div>
              {a.mode === 'WFA' && <StatusBadge a={a} />}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-gray-500 min-w-[64px]">{a.workLocation?.name ?? a.mode}</div>
              <div className="flex-1 grid grid-cols-2 gap-2 text-center">
                <div className={`text-lg ${inCls}`}>{fmtTime(a.checkInAt)}</div>
                <div className={`text-lg ${outCls}`}>{fmtTime(a.checkOutAt)}</div>
              </div>
              <ChevronRight className="text-gray-300 size-5 ml-2" />
            </div>
            {(a.isLate || a.isEarlyLeave) && (
              <div className="mt-2 text-[11px] text-red-600 flex gap-2">
                {a.isLate && <span>● Telat clock-in</span>}
                {a.isEarlyLeave && <span>● Clock-out lebih awal</span>}
              </div>
            )}
            {a.notes && <div className="mt-2 text-xs text-gray-500 italic">&ldquo;{a.notes}&rdquo;</div>}
            {a.approvalNote && <div className="mt-1 text-xs text-red-600">Catatan: {a.approvalNote}</div>}
          </div>
        )
      })}

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

function StatusBadge({ a }: { a: { mode: string; approvalStatus: string } }) {
  const c = a.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
            a.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
  return <span className={`text-[10px] px-2 py-0.5 rounded ${c}`}>WFA {a.approvalStatus}</span>
}
