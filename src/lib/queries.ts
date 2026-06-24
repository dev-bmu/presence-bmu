'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as svc from './services'

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: svc.me, retry: false })

export const useShiftToday = () => useQuery({ queryKey: ['shift-today'], queryFn: svc.getShiftToday })

export const useMyLocations = () => useQuery({ queryKey: ['my-locations'], queryFn: svc.getMyLocations })

export const useAttendanceToday = () =>
  useQuery({ queryKey: ['attendance-today'], queryFn: svc.getAttendanceToday, refetchOnWindowFocus: true })

export const useHistory = (from?: string, to?: string, page = 1) =>
  useQuery({ queryKey: ['history', from, to, page], queryFn: () => svc.getHistory(from, to, page) })

export const useCheckIn = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: svc.checkIn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-today'] })
      qc.invalidateQueries({ queryKey: ['history'] })
    }
  })
}

export const useCheckOut = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: svc.checkOut,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-today'] })
      qc.invalidateQueries({ queryKey: ['history'] })
    }
  })
}
