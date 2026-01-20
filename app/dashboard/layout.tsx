import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { signOut } from '@/app/auth/actions'

// Simple Dashboard Layout
export default async function DashboardLayout({
    children,
}: {
    children: ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">Trip Link Dashboard</h1>
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                        <span>{user.email}</span>
                        <form action={signOut}>
                            <button type="submit" className="text-sm text-red-600 hover:text-red-500 transition-colors">
                                Выйти
                            </button>
                        </form>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
