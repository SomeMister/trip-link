'use client'

import { useActionState, useEffect, useState } from 'react'
import { submitApplication, ApplicationState } from '@/app/t/[slug]/actions'

const initialState: ApplicationState = { message: null, errors: {} }

export function ApplicationForm({ tripId }: { tripId: string }) {
    const [state, formAction, isPending] = useActionState(submitApplication, initialState)
    const [isSuccess, setIsSuccess] = useState(false)
    const [contactType, setContactType] = useState<'telegram' | 'instagram' | 'phone'>('telegram')

    useEffect(() => {
        if (state.message === 'Application sent successfully!') {
            setIsSuccess(true)
        }
    }, [state.message])

    if (isSuccess) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-green-900">Application Sent!</h3>
                <p className="mt-2 text-sm text-green-700">
                    The organizer has received your request. They will contact you shortly.
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Join this Trip</h3>
            <form action={formAction} className="space-y-4">
                <input type="hidden" name="trip_id" value={tripId} />

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                        placeholder="John Doe"
                    />
                    {state.errors?.name && <p className="text-red-600 text-xs mt-1">{state.errors.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Preferred Contact</label>
                    <div className="mt-2 flex space-x-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="contact_type"
                                value="telegram"
                                checked={contactType === 'telegram'}
                                onChange={() => setContactType('telegram')}
                                className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                            />
                            <span className="ml-2 text-sm text-slate-900">Telegram</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="contact_type"
                                value="instagram"
                                checked={contactType === 'instagram'}
                                onChange={() => setContactType('instagram')}
                                className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                            />
                            <span className="ml-2 text-sm text-slate-900">Instagram</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="contact_type"
                                value="phone"
                                checked={contactType === 'phone'}
                                onChange={() => setContactType('phone')}
                                className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                            />
                            <span className="ml-2 text-sm text-slate-900">Phone</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label htmlFor="contact_value" className="block text-sm font-medium text-slate-700 mt-2">
                        {contactType === 'telegram' && 'Telegram Username'}
                        {contactType === 'instagram' && 'Instagram Handle'}
                        {contactType === 'phone' && 'Phone Number'}
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="contact_value"
                            id="contact_value"
                            required
                            className="block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                            placeholder={
                                contactType === 'telegram' ? '@username' :
                                    contactType === 'instagram' ? '@handle' :
                                        '+48 123 456 789'
                            }
                        />
                    </div>
                    {state.errors?.contact && <p className="text-red-600 text-xs mt-1">{state.errors.contact}</p>}
                </div>

                <div>
                    <label htmlFor="seats_requested" className="block text-sm font-medium text-slate-700">Seats</label>
                    <input
                        type="number"
                        name="seats_requested"
                        id="seats_requested"
                        min="1"
                        defaultValue="1"
                        required
                        className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                    />
                    {state.errors?.seats_requested && <p className="text-red-600 text-xs mt-1">{state.errors.seats_requested}</p>}
                </div>

                <div>
                    <label htmlFor="note" className="block text-sm font-medium text-slate-700">Note (Optional)</label>
                    <textarea
                        name="note"
                        id="note"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                        placeholder="Any questions or special requests?"
                    />
                </div>

                {state.message && !isSuccess && (
                    <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
                        {state.message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                >
                    {isPending ? 'Sending...' : 'Send Application'}
                </button>
            </form>
        </div>
    )
}
