// app/page.tsx - Home page
import LoginButton from '@/components/auth/LoginButton'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            SpendScope
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            See your spending before it happens
          </p>
          <LoginButton />
        </div>
      </div>
    </main>
  )
}