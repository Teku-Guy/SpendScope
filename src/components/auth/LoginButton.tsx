// components/auth/LoginButton.tsx
'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export default function LoginButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="animate-pulse bg-gray-200 h-10 w-24 rounded"></div>
  }

  if (session) {
    return (
        <div className="flex items-center gap-4">
        <div className="text-sm">
          <p className="font-medium">{session.user?.name}</p>
          <p className="text-gray-500">{session.user?.email}</p>
        </div>
        <button 
          onClick={() => signOut()} 
        >
          Sign Out
        </button>
        </div>
    )
  }

  return (
    <button 
      onClick={() => signIn('google')}
      className="bg-blue-600 hover:bg-blue-700"
    >
      Sign in with Google
    </button>
  )
}