'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/db'
import type { User } from '@/types'

interface Props {
  user: User
}

export default function Navbar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    signOut()
    router.push('/login')
  }

  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase()

  const links = [
    { href: '/catalog', label: 'Cursos' },
    { href: '/profile', label: 'Perfil' },
    ...(user.role === 'admin' ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand-mark">A+</div>
        <div className="topbar-title">
          <strong>Aprenda+</strong>
          <span>{user.email} · {user.role}</span>
        </div>
      </div>

      <nav className="tabs" aria-label="Navegação principal">
        {links.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={`tab ${active ? 'active' : ''}`}>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="topbar-actions">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
          }}
          title={user.email}
        >
          {initials}
        </div>
        <button className="button secondary" style={{ minHeight: 38, padding: '0 14px' }} onClick={handleLogout}>
          Sair
        </button>
      </div>
    </header>
  )
}
