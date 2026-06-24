// Penyamaran data sensitif untuk tampilan.
export function maskNik(nik: string): string {
  if (!nik) return '-'
  if (nik.length <= 6) return nik
  return nik.slice(0, 4) + '•'.repeat(nik.length - 6) + nik.slice(-2)
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '-'
  const [local, domain] = email.split('@')
  const head = local.slice(0, 2)
  const masked = local.length > 2 ? head + '•'.repeat(Math.max(2, local.length - 2)) : head
  return `${masked}@${domain}`
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return '-'
  if (phone.length <= 4) return phone
  return phone.slice(0, 3) + '•'.repeat(phone.length - 5) + phone.slice(-2)
}
