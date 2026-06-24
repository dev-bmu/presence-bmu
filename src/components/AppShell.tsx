'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Clock, User, LogOut } from 'lucide-react'
import { clearTokens, getRefreshToken } from '@/lib/auth'
import { logout as svcLogout } from '@/lib/services'

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const onLogout = async () => {
    const rt = getRefreshToken()
    if (rt) await svcLogout(rt).catch(() => {})
    clearTokens()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[var(--bg)]">
      {/* Header */}
      <header
        className="sticky top-0 z-10 text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0f2c52 0%, #143a6b 55%, #15803d 130%)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-white/95 p-1.5">
              <Image src="/bmu-logo.svg" alt="BMU" width={28} height={28} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider opacity-80">Presence BMU</div>
              {title && <div className="text-base font-semibold leading-tight">{title}</div>}
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg hover:bg-white/15 active:scale-95 transition" aria-label="Logout">
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 pb-28">{children}</main>

      {/* Bottom nav — transparan + blur */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto">
        <div
          className="m-3 flex justify-around py-2 px-2 rounded-2xl border border-white/40"
          style={{
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: 'blur(18px) saturate(160%)',
            boxShadow: '0 10px 30px -12px rgba(15,23,42,0.25)'
          }}
        >
          <NavItem href="/" icon={<Home className="size-5" />} label="Beranda" active={pathname === '/'} />
          <NavItem href="/history" icon={<Clock className="size-5" />} label="Riwayat" active={pathname === '/history'} />
          <NavItem href="/profile" icon={<User className="size-5" />} label="Profil" active={pathname === '/profile'} />
        </div>
      </nav>
    </div>
  )
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-1 py-1.5 rounded-xl transition ${
        active ? 'text-white bg-[var(--brand)] shadow' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  )
}
