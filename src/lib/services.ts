import api from './axios'
import type { Attendance, Employee, LoginResponse, Shift, WorkLocation } from './types'

type ApiOk<T> = { data: T }

export async function login(email: string, password: string): Promise<LoginResponse> {
  const r = await api.post<ApiOk<LoginResponse>>('/presence/app/auth/login', { email, password })
  return r.data.data
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/presence/app/auth/logout', { refreshToken })
}

export async function me(): Promise<Employee> {
  const r = await api.get<ApiOk<Employee>>('/presence/app/auth/me')
  return r.data.data
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await api.post('/presence/app/auth/change-password', { oldPassword, newPassword })
}

export async function getShiftToday(): Promise<{ date: string; shift: Shift | null }> {
  const r = await api.get<ApiOk<{ date: string; shift: Shift | null }>>('/presence/app/me/shift-today')
  return r.data.data
}

export async function getMyLocations(): Promise<WorkLocation[]> {
  const r = await api.get<ApiOk<WorkLocation[]>>('/presence/app/me/locations')
  return r.data.data
}

export async function getAttendanceToday(): Promise<Attendance | null> {
  const r = await api.get<ApiOk<Attendance | null>>('/presence/app/me/attendance/today')
  return r.data.data
}

export async function getHistory(from?: string, to?: string, page = 1) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  params.set('page', String(page))
  const r = await api.get<ApiOk<{ attendances: Attendance[]; pagination: { totalData: number; page: number; limit: number; totalPage: number } }>>(
    `/presence/app/me/attendance/history?${params}`
  )
  return r.data.data
}

function photoName(blob: Blob): string {
  return blob.type === 'image/webp' ? 'photo.webp' : 'photo.jpg'
}

export async function checkIn(opts: {
  mode: 'WFA' | 'WFO'
  notes?: string
  lat: number
  lng: number
  photo: Blob
}): Promise<Attendance> {
  const fd = new FormData()
  fd.append('mode', opts.mode)
  if (opts.notes) fd.append('notes', opts.notes)
  fd.append('lat', String(opts.lat))
  fd.append('lng', String(opts.lng))
  fd.append('photo', opts.photo, photoName(opts.photo))
  const r = await api.post<ApiOk<Attendance>>('/presence/app/me/attendance/check-in', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return r.data.data
}

export async function checkOut(opts: { lat: number; lng: number; photo?: Blob }): Promise<Attendance> {
  const fd = new FormData()
  fd.append('lat', String(opts.lat))
  fd.append('lng', String(opts.lng))
  if (opts.photo) fd.append('photo', opts.photo, photoName(opts.photo))
  const r = await api.post<ApiOk<Attendance>>('/presence/app/me/attendance/check-out', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return r.data.data
}
