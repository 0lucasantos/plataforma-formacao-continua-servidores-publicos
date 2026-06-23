'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/db'
import { User as UserIcon, Settings, BookOpenText, DoorOpen } from "lucide-react"
import type { ReactNode } from 'react'
import type { User } from '@/types'

const TABS_ICONS: Record<string, ReactNode> = {
  Cursos: <BookOpenText size={35}/>,
  Perfil: <UserIcon size={35}/>,
  Admin: <Settings size={35}/>,
  Sair: <DoorOpen size={35}/>,
}

function getTabIcon(category: string) {
  return TABS_ICONS[category] ?? '📚'
}

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
    <header className="bottombar">
      <nav className="tabs" aria-label="Navegação principal">
        {links.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={`tab ${active ? 'active' : ''}`}
            >
              <div className="tab-name">
                <span>{getTabIcon(label)}</span>
                <span>{label}</span>
              </div>
            </Link>
          )
        })}

        <button
          className="tab logout-tab"
          onClick={handleLogout}
        >
          <div className="tab-name">
            <span>{getTabIcon('Sair')}</span>
            <span>Sair</span>
          </div>
        </button>
      </nav>
    </header>
  )
}
