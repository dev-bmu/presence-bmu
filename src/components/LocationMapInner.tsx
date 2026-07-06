'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, useMap } from 'react-leaflet'
import type { MapLocation } from './LocationMap'

type Props = { lat: number; lng: number; accuracy?: number; locations: MapLocation[]; height?: number }

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom() || 17, { animate: true })
  }, [lat, lng, map])
  return null
}

export default function LocationMapInner({ lat, lng, accuracy = 0, locations, height = 240 }: Props) {
  const center: [number, number] = [lat, lng]
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ height }}>
      <MapContainer center={center} zoom={17} style={{ height: '100%', width: '100%' }} scrollWheelZoom zoomControl={false} attributionControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* radius lokasi kerja */}
        {locations.map((l) => (
          <Circle
            key={l.id}
            center={[l.latitude, l.longitude]}
            radius={l.radiusMeter}
            pathOptions={{ color: '#15803d', fillColor: '#16a34a', fillOpacity: 0.12, weight: 2 }}
          />
        ))}

        {/* akurasi GPS user */}
        {accuracy > 0 && (
          <Circle center={center} radius={accuracy} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} />
        )}
        {/* titik user */}
        <CircleMarker center={center} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }} />

        <Recenter lat={lat} lng={lng} />
      </MapContainer>
    </div>
  )
}
