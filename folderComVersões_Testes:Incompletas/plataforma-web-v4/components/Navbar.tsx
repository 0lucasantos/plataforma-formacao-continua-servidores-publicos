'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  function handleSignOut() {
    signOut()
    router.replace('/login')
  }

  function isActive(path: string) {
    return pathname.startsWith(path) ? 'topbar-link active' : 'topbar-link'
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className="topbar">
      <Link href="/" className="topbar-brand">
        <div className="topbar-mark">A+</div>
        <span className="topbar-name">Aprenda+</span>
      </Link>

      <nav className="topbar-nav">
        {user?.role === 'admin' ? (
          <Link href="/admin" className={isActive('/admin')}>Administração</Link>
        ) : (
          <>
            <Link href="/catalog" className={isActive('/catalog')}>Cursos</Link>
            <Link href="/profile" className={isActive('/profile')}>Perfil</Link>
          </>
        )}
      </nav>

      <div className="topbar-right">
        <div className="topbar-avatar" title={user?.name ?? user?.email}>{initial}</div>
        <button className="btn btn-sm btn-secondary" onClick={handleSignOut}>Sair</button>
      </div>
    </header>
  )
}
