import { ReactNode } from 'react'

export function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
            {children}
        </div>
    )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
        </div>
    )
}
