'use client'

import { useActionState, useEffect, useState } from 'react'
import { submitApplication, ApplicationState } from '@/app/t/[slug]/actions'
import { CheckCircle2, MessageCircle, Instagram, Phone } from 'lucide-react'

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
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900">Application Sent!</h3>
                <p className="mt-2 text-sm text-emerald-700">
                    The organizer has received your request. They will contact you shortly.
                </p>
            </div>
        )
    }

    return (
        <div className="w-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Join this Trip</h3>
            <form action={formAction} className="space-y-5">
                <input type="hidden" name="trip_id" value={tripId} />

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-white transition-all"
                        placeholder="e.g. Alice Smith"
                    />
                    {state.errors?.name && <p className="text-red-600 text-xs mt-1">{state.errors.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Contact</label>
                    <div className="grid grid-cols-3 gap-3">
                        <label className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${contactType === 'telegram' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <input
                                type="radio"
                                name="contact_type"
                                value="telegram"
                                checked={contactType === 'telegram'}
                                onChange={() => setContactType('telegram')}
                                className="sr-only"
                            />
                            <MessageCircle className={`w-5 h-5 mb-1 ${contactType === 'telegram' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className="text-xs font-medium">Telegram</span>
                        </label>
                        <label className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${contactType === 'instagram' ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <input
                                type="radio"
                                name="contact_type"
                                value="instagram"
                                checked={contactType === 'instagram'}
                                onChange={() => setContactType('instagram')}
                                className="sr-only"
                            />
                            <Instagram className={`w-5 h-5 mb-1 ${contactType === 'instagram' ? 'text-pink-600' : 'text-slate-400'}`} />
                            <span className="text-xs font-medium">Instagram</span>
                        </label>
                        <label className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${contactType === 'phone' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <input
                                type="radio"
                                name="contact_type"
                                value="phone"
                                checked={contactType === 'phone'}
                                onChange={() => setContactType('phone')}
                                className="sr-only"
                            />
                            <Phone className={`w-5 h-5 mb-1 ${contactType === 'phone' ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="text-xs font-medium">Phone</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label htmlFor="contact_value" className="block text-sm font-medium text-slate-700 mb-1.5">
                        {contactType === 'telegram' && 'Telegram Username'}
                        {contactType === 'instagram' && 'Instagram Handle'}
                        {contactType === 'phone' && 'Phone Number'}
                    </label>
                    <input
                        type="text"
                        name="contact_value"
                        id="contact_value"
                        required
                        className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-white transition-all"
                        placeholder={
                            contactType === 'telegram' ? '@username' :
                                contactType === 'instagram' ? '@handle' :
                                    '+48 123 456 789'
                        }
                    />
                    {state.errors?.contact && <p className="text-red-600 text-xs mt-1">{state.errors.contact}</p>}
                </div>

                <div>
                    <label htmlFor="seats_requested" className="block text-sm font-medium text-slate-700 mb-1.5">Seats Needed</label>
                    <input
                        type="number"
                        name="seats_requested"
                        id="seats_requested"
                        min="1"
                        defaultValue="1"
                        required
                        className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-white transition-all"
                    />
                    {state.errors?.seats_requested && <p className="text-red-600 text-xs mt-1">{state.errors.seats_requested}</p>}
                </div>

                <div>
                    <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1.5">Note (Optional)</label>
                    <textarea
                        name="note"
                        id="note"
                        rows={3}
                        className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-white transition-all"
                        placeholder="Any questions or special requests?"
                    />
                </div>

                {state.message && !isSuccess && (
                    <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                        {state.message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-500 hover:shadow-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-all"
                >
                    {isPending ? 'Sending...' : 'Send Application'}
                </button>
            </form>
        </div>
    )
}
