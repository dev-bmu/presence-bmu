export type AttendanceMode = 'WFA' | 'WFO'
export type AttendanceApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW' | 'NOT_REQUIRED'

export interface Employee {
  id: string
  nik: string
  name: string
  email: string
  phone?: string | null
  jabatan?: string | null
  employmentStatus: 'CASUAL' | 'PKWT' | 'PKWTT'
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED'
  unit: { id: string; name: string; code: string } | null
  cluster: { id: string; name: string; code: string } | null
}

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  graceMinIn: number
  graceMinOut: number
  crossDay: boolean
}

export interface WorkLocation {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  radiusMeter: number
  isPrimary: boolean
}

export interface Attendance {
  id: string
  date: string
  mode: AttendanceMode
  shiftId: string | null
  shift?: Shift | null
  workLocationId: string | null
  workLocation?: { id: string; name: string } | null
  checkInAt: string
  checkOutAt: string | null
  isLate: boolean
  isEarlyLeave: boolean
  notes: string | null
  approvalStatus: AttendanceApprovalStatus
  approvalNote: string | null
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  employee: Employee
}
