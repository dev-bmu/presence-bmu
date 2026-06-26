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
        className="sticky top-0 z-10 text-white px-4 pt-4 pb-4 shadow-md"
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

      <main className="flex-1 p-4 pb-24">{children}</main>

      {/* Bottom nav — bar penuh, nempel bawah, blur tipis */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t border-slate-200/70 px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-20"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px) saturate(160%)',
          WebkitBackdropFilter: 'blur(16px) saturate(160%)'
        }}
      >
        <div className="flex justify-around">
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
      className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-xl transition ${
        active ? 'text-[var(--brand-700)]' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <span className={`grid place-items-center size-9 rounded-xl transition ${active ? 'bg-[var(--brand-50)]' : ''}`}>{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}
