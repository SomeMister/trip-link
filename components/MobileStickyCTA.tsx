'use client'

import { Users } from 'lucide-react'

interface MobileStickyCTAProps {
    seatsLeft: number | null
    isFull: boolean
}

export function MobileStickyCTA({ seatsLeft, isFull }: MobileStickyCTAProps) {
    const scrollToForm = () => {
        document.getElementById('application-section')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 flex items-center justify-between z-50 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Набор мест</span>
                <span className={`text-sm font-bold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isFull ? '🔥 Мест нет' : seatsLeft !== null ? `${seatsLeft} свободно` : 'Открыто'}
                </span>
            </div>
            <button
                onClick={scrollToForm}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-teal-600/20"
            >
                Участвовать
            </button>
        </div>
    )
}