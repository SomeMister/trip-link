'use client'

import { AlertCircle } from 'lucide-react'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6 text-center max-w-md">
                Failed to load data. Please try again.
            </p>
            <button
                onClick={reset}
                className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all"
            >
                Try Again
            </button>
        </div>
    )
}
