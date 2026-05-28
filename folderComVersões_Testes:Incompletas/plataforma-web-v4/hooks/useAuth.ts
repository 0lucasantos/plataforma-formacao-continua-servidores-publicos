'use client'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/db'
import type { User } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
