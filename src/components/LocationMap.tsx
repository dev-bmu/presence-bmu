'use client'

import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

export type MapLocation = { id: string; name: string; latitude: number; longitude: number; radiusMeter: number }

type Props = {
  lat: number
  lng: number
  accuracy?: number
  locations: MapLocation[]
  height?: number
}

const Inner = dynamic(() => import('./LocationMapInner'), {
  ssr: false,
  loading: () => <div className="w-full bg-slate-100 rounded-2xl flex items-center justify-center text-sm text-slate-400" style={{ height: 240 }}>Memuat peta…</div>
})

export default function LocationMap(props: Props) {
  return <Inner {...props} />
}
