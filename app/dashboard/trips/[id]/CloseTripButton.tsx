'use client'

import { closeTrip } from './actions'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

export function CloseTripButton({ tripId }: { tripId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCloseConfirm = async () => {
        setIsLoading(true)
        setError(null)

        const res = await closeTrip(tripId)
        setIsLoading(false)

        if (res?.error) {
            setError(res.error)
        } else {
            setIsModalOpen(false)
        }
    }

    return (
        <>
            <button
                onClick={() => { setIsModalOpen(true); setError(null); }}
                disabled={isLoading}
                className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-100 disabled:opacity-50"
            >
                {isLoading ? 'Closing...' : 'Close Trip'}
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Close Trip"
            >
                <div>
                    <p className="text-sm text-slate-600 mb-6">
                        Are you sure you want to close this trip? <br />
                        <strong className="text-red-600 block mt-2">No more applications will be accepted and the public page will show a closed message.</strong>
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
                            onClick={handleCloseConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-500"
                        >
                            Yes, Close Trip
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
