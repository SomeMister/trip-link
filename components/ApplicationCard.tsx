'use client'

import { useTransition } from 'react'
import { updateApplicationStatus } from '@/app/dashboard/trips/[id]/actions'
import { Check, X, Clock, Send, Instagram, Phone } from 'lucide-react'

interface ApplicationCardProps {
    application: any
    tripId: string
}

export function ApplicationCard({ application, tripId }: ApplicationCardProps) {
    const [isPending, startTransition] = useTransition()

    const handleStatusUpdate = (newStatus: string) => {
        startTransition(async () => {
            // Fix: correct argument order and count matching actions.ts
            // updateApplicationStatus(tripId, applicationId, newStatus, seatsRequested)
            await updateApplicationStatus(tripId, application.id, newStatus as any, application.seats_requested)
        })
    }

    return (
        <div className={`group bg-white rounded-3xl border p-5 shadow-sm transition-all ${isPending ? 'opacity-50' : 'opacity-100'} border-slate-100 text-left`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-bold text-slate-900 text-lg">{application.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                        {application.contact_telegram && <Send className="w-3 h-3 text-sky-500" />}
                        {application.contact_instagram && <Instagram className="w-3 h-3 text-pink-500" />}
                        {application.contact_phone && <Phone className="w-3 h-3 text-emerald-500" />}
                        <span className="text-xs font-medium text-slate-500">
                            {application.contact_telegram || application.contact_instagram || application.contact_phone || 'Нет контакта'}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase">Места</span>
                    <div className="text-lg font-black text-slate-900">{application.seats_requested}</div>
                </div>
            </div>

            {/* Кнопки действий (Да / Лист / Нет) */}
            <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={isPending || application.status === 'approved'}
                    className="flex flex-row items-center justify-center gap-1.5 p-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-30"
                >
                    <Check className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight hidden sm:inline">Approve</span>
                </button>
                <button
                    onClick={() => handleStatusUpdate('waitlist')}
                    disabled={isPending || application.status === 'waitlist'}
                    className="flex flex-row items-center justify-center gap-1.5 p-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-30"
                >
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight hidden sm:inline">Waitlist</span>
                </button>
                <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={isPending || application.status === 'rejected'}
                    className="flex flex-row items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30"
                >
                    <X className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight hidden sm:inline">Reject</span>
                </button>
            </div>
        </div>
    )
}