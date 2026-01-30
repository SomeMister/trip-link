'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { PageContainer } from '@/components/ui/PageContainer'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setMessage('Error sending magic link: ' + error.message)
        } else {
            setMessage('Magic link sent! Check your email.')
        }
        setLoading(false)
    }

    const handleGoogleLogin = async () => {
        setLoading(true)
        setMessage(null)

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setMessage('Error logging in with Google: ' + error.message)
            setLoading(false)
        }
        // No need to set loading false on success strictly, as we are redirecting
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8 p-10 bg-white shadow-xl shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">Sign in to manage your trips</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-2">
                            Email address
                        </label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="block w-full rounded-lg border-0 py-3 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-4 bg-slate-50 focus:bg-white transition-all"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 transition-all shadow-lg shadow-indigo-200"
                        >
                            {loading ? 'Sending...' : 'Send Magic Link'}
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-slate-500">or</span>
                        </div>
                    </div>

                    <div>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleGoogleLogin}
                            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:outline-offset-0 disabled:opacity-70 transition-all"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                                <path
                                    d="M12.0003 20.45c4.656 0 8.5566-3.2132 9.9806-7.5683l-3.003-1.0264c-0.9765 2.9804-3.6644 5.1818-6.9776 5.1818-4.0772 0-7.3828-3.3056-7.3828-7.3828s3.3056-7.3828 7.3828-7.3828c1.7828 0 3.414.6366 4.7004 1.6934l2.6033-2.6033c-1.9566-1.636-4.4842-2.623-7.3037-2.623-6.2087 0-11.2415 5.0327-11.2415 11.2415s5.0328 11.2415 11.2415 11.2415c.5704 0 1.1306-.0462 1.6783-.1348l-.3375-3.0818c-.439.071-.8905.109-1.3527.109z"
                                    fill="#EA4335"
                                />
                                <path
                                    d="M23.4883 10.6368c.1128.6014.172 1.2223.172 1.861 0 5.6192-3.9575 10.1472-9.1304 10.636l.3375 3.0818c6.9126-.6528 12.206-6.703 12.206-13.9174 0-1.0964-.1312-2.1616-.3795-3.1816l-3.2056.5202z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M5.0227 7.2348c-1.424 4.355-1.424 9.1752 0 13.5303l3.003-1.0264c-0.9766-2.9804-0.9766-6.2796 0-9.26l-3.003-1.244z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12.0003 3.5352c2.8195 0 5.347 1.054 7.3037 2.623l-2.6033 2.6033c-1.2864-1.0568-2.9176-1.6934-4.7004-1.6934-3.3132 0-6.001 2.2014-6.9776 5.1818l-3.003 1.2438c1.424-4.355 5.3246-7.5682 9.9806-7.5682z"
                                    fill="#34A853"
                                />
                            </svg>
                            <span className="text-sm font-semibold leading-6">Continue with Google</span>
                        </button>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg text-sm text-center font-medium ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                            {message}
                        </div>
                    )}
                </form>
            </div >
        </div >
    )
}
