# presence.bmuconnect.id

FE Next.js untuk karyawan casual BMU. Consume API `HR BMU/BE` di `/api/presence/app/*`.

## Setup

```bash
cp .env.example .env
# set NEXT_PUBLIC_API_BASE_URL=http://localhost:4002 (atau URL prod)
npm install
npm run dev    # port 3005
```

## Build

```bash
npm run build && npm start
```

## Catatan

- Auth: JWT karyawan (access 15m, refresh 7d) disimpan di `localStorage`.
- Foto: dikompres client-side max ~1.5MB sebelum upload.
- Geolocation: `enableHighAccuracy: true`, server tetap source of truth.
- PWA: manifest sudah ada, ikon `/icon-192.png` & `/icon-512.png` masih placeholder (TODO).
- Service worker: belum (YAGNI sampai butuh offline).
