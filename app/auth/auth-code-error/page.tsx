'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description')

    // Determine user-friendly operational message
    let title = 'Authentication Failed'
    let message = 'There was a problem signing you in. Please try again.'
    let action = 'retry' // retry | contact

    if (errorCode === 'otp_expired') {
        title = 'Link Expired'
        message = 'The login link you used has expired or has already been used. Magic links are one-time use only.'
    } else if (error === 'access_denied') {
        title = 'Access Denied'
        message = errorDescription || 'You do not have permission to access this resource.'
    }

    return (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/60 max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
            </div>

            <h1 className="text-2xl font-black text-slate-900 mb-3">{title}</h1>

            <p className="text-slate-600 mb-8 leading-relaxed">
                {message}
            </p>

            <div className="space-y-3">
                <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
                >
                    <RefreshCw className="h-5 w-5" />
                    Try Logging In Again
                </Link>

                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold py-3.5 px-6 rounded-xl transition-all"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Home
                </Link>
            </div>

            {/* Technical details for debugging, hidden behind a small text or just subtle */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-mono break-all">
                    Code: {errorCode || 'unknown'} / {error || 'unknown'}
                </p>
                {errorDescription && (
                    <p className="text-xs text-slate-400 font-mono mt-1 line-clamp-2">
                        {errorDescription}
                    </p>
                )}
            </div>
        </div>
    )
}

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-slate-500">Loading error details...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    )
}
