'use client'

import { ApplicationStatus } from '@/lib/types'
import { updateApplicationStatus } from './actions'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface InboxApplicationRowProps {
    app: {
        id: string
        name: string
        contact_telegram?: string
        contact_phone?: string
        contact_instagram?: string
        seats_requested: number
        note?: string
        status: string // coming as string from DB, we cast
        created_at: string
    }
    tripId: string
    onUpdate?: () => void
}

export function InboxApplicationRow({ app, tripId }: InboxApplicationRowProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const requestStatusChange = (newStatus: ApplicationStatus) => {
        setPendingStatus(newStatus)
        setError(null)
        setIsModalOpen(true)
    }

    const confirmStatusChange = async () => {
        if (!pendingStatus) return

        setIsLoading(true)


        const result = await updateApplicationStatus(tripId, app.id, pendingStatus, app.seats_requested)
        setIsLoading(false)

        if (result.error) {
            setError(result.error)
        } else {
            setPendingStatus(null)
            setIsModalOpen(false)
        }
    }

    const currentStatus = app.status as ApplicationStatus

    // Determine primary contact to show
    let contactLabel = 'Unknown'
    let contactValue = '-'
    let contactLink = null

    if (app.contact_telegram) {
        contactLabel = 'TG'
        contactValue = app.contact_telegram
        contactLink = `https://t.me/${app.contact_telegram.replace('@', '')}`
    } else if (app.contact_instagram) {
        contactLabel = 'IG'
        contactValue = app.contact_instagram
        contactLink = `https://instagram.com/${app.contact_instagram.replace('@', '')}`
    } else if (app.contact_phone) {
        contactLabel = 'TEL'
        contactValue = app.contact_phone
        contactLink = `tel:${app.contact_phone.replace(/\s+/g, '')}`
    }

    return (
        <>
            <tr className={isLoading ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {app.name}
                    {app.note && (
                        <div className="text-xs text-slate-500 mt-1 max-w-[200px] whitespace-normal truncate">
                            note: {app.note}
                        </div>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {app.seats_requested}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                            {contactLabel}
                        </span>
                        {contactLink ? (
                            <a href={contactLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                {contactValue}
                            </a>
                        ) : (
                            <span>{contactValue}</span>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(app.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${currentStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        currentStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            currentStatus === 'waitlist' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                        }`}>
                        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    {currentStatus !== 'approved' && (
                        <button
                            onClick={() => requestStatusChange('approved')}
                            disabled={isLoading}
                            className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                            Approve
                        </button>
                    )}
                    {currentStatus !== 'waitlist' && (
                        <button
                            onClick={() => requestStatusChange('waitlist')}
                            disabled={isLoading}
                            className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                        >
                            Waitlist
                        </button>
                    )}
                    {currentStatus !== 'rejected' && (
                        <button
                            onClick={() => requestStatusChange('rejected')}
                            disabled={isLoading}
                            className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                            Reject
                        </button>
                    )}
                </td>
            </tr>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Confirm ${pendingStatus?.charAt(0).toUpperCase()}${pendingStatus?.slice(1)}`}
            >
                <div>
                    <p className="text-sm text-slate-600 mb-6">
                        Are you sure you want to mark <strong>{app.name}</strong> as <strong>{pendingStatus}</strong>?
                        {pendingStatus === 'approved' && (
                            <span className="block mt-2 text-indigo-600 bg-indigo-50 p-2 rounded">
                                This will deduct {app.seats_requested} seats from the trip.
                            </span>
                        )}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmStatusChange}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm ${pendingStatus === 'rejected' ? 'bg-red-600 hover:bg-red-500' :
                                pendingStatus === 'approved' ? 'bg-green-600 hover:bg-green-500' :
                                    'bg-yellow-600 hover:bg-yellow-500' // Waitlist
                                }`}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
