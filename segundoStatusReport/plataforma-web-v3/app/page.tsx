'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const hasToken = !!localStorage.getItem('auth_token')
    router.replace(hasToken ? '/catalog' : '/login')
  }, [router])
  return null
}
