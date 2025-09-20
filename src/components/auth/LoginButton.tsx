// components/auth/LoginButton.tsx
'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button';

export default function LoginButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="animate-pulse bg-muted h-10 w-24 rounded"></div>
  }

  if (session) {
    return (
        <div className="flex items-center gap-4">
        <div className="text-sm">
          <p className="font-medium">{session.user?.name}</p>
          <p className="text-muted-foreground">{session.user?.email}</p>
        </div>
        <Button 
          onClick={() => signOut()} 
          variant="outline"
        >
          Sign Out
        </Button>
        </div>
    )
  }

  return (
    <Button
      onClick={() => signIn('google')}
      className="bg-primary hover:bg-primary/90"
    >
      Sign in with Google
    </Button>
  )
}