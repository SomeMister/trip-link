'use client'

import { useActionState, useState } from 'react'
import { createTrip, CreateTripState } from '../actions'
import { extractTripDetails } from '@/lib/extractFromText'
import { ParsedTripFields } from '@/lib/types'
import { PageContainer } from '@/components/ui/PageContainer'

const initialState: CreateTripState = { message: null, errors: {} }

export default function NewTripPage() {
    const [state, formAction, isPending] = useActionState(createTrip, initialState)
    const [activeTab, setActiveTab] = useState<'paste' | 'telegram'>('paste')

    // Inputs
    const [rawText, setRawText] = useState('')
    const [telegramUrl, setTelegramUrl] = useState('')
    const [loadingImport, setLoadingImport] = useState(false)
    const [importError, setImportError] = useState<string | null>(null)

    const [fields, setFields] = useState<ParsedTripFields>({})

    // Handler for Paste Text
    const handlePasteParse = () => {
        const { fields: extracted } = extractTripDetails(rawText)
        setFields(prev => ({ ...prev, ...extracted }))
    }

    // Handler for Telegram Import
    const handleTelegramImport = async () => {
        setLoadingImport(true)
        setImportError(null)
        try {
            const res = await fetch('/api/import/telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: telegramUrl })
            })
            const data = await res.json()

            if (!res.ok) {
                setImportError(data.error || 'Import failed')
            } else {
                setRawText(data.text);
                const { fields: extracted } = extractTripDetails(data.text)
                setFields(prev => ({ ...prev, ...extracted }))
            }
        } catch {
            setImportError('Import failed due to network error')
        } finally {
            setLoadingImport(false)
        }
    }

    // Handle manual field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFields(prev => ({
            ...prev,
            [name]: name === 'price_amount' || name === 'seats_total' ? Number(value) : value
        }))
    }

    return (
        <PageContainer>
            <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Create New Trip</h2>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1 rounded-xl shadow-sm ring-1 ring-slate-100 inline-flex">
                        <button
                            onClick={() => setActiveTab('paste')}
                            className={`${activeTab === 'paste' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'} px-6 py-2.5 rounded-lg text-sm font-medium transition-all`}
                        >
                            Paste Text
                        </button>
                        <button
                            onClick={() => setActiveTab('telegram')}
                            className={`${activeTab === 'telegram' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'} px-6 py-2.5 rounded-lg text-sm font-medium transition-all`}
                        >
                            Telegram URL
                        </button>
                    </div>
                </div>

                {/* Import Area */}
                <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-100 mb-8 transition-all">
                    {activeTab === 'paste' ? (
                        <>
                            <label className="block text-sm font-semibold text-slate-900 mb-3">
                                Paste Post Text
                            </label>
                            <textarea
                                className="w-full h-40 p-4 border-0 ring-1 ring-slate-200 rounded-xl mb-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition-all resize-none"
                                placeholder="Paste your Instagram/Facebook text here..."
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handlePasteParse}
                                    className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-semibold transition-colors"
                                >
                                    Auto-Fill Form
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <label className="block text-sm font-semibold text-slate-900 mb-3">
                                Telegram Message URL
                            </label>
                            {importError && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                                    {importError}
                                </div>
                            )}
                            <div className="flex gap-3 mb-6">
                                <input
                                    type="text"
                                    className="flex-1 p-3 border-0 ring-1 ring-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition-all"
                                    placeholder="https://t.me/channel/123"
                                    value={telegramUrl}
                                    onChange={(e) => setTelegramUrl(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleTelegramImport}
                                    disabled={loadingImport}
                                    className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-semibold disabled:opacity-50 transition-colors"
                                >
                                    {loadingImport ? 'Importing...' : 'Import'}
                                </button>
                            </div>
                            {rawText && (
                                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Imported Text Preview</p>
                                    <div className="text-sm text-slate-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                        {rawText}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                </div>

                {/* Step 2: Form */}
                <form action={formAction} className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-100 space-y-8">
                    <input type="hidden" name="description_raw" value={rawText} />

                    <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">

                        <div className="sm:col-span-4">
                            <label htmlFor="title" className="block text-sm font-semibold text-slate-900 mb-2">Trip Title</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                value={fields.title || ''}
                                onChange={handleChange}
                                className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-slate-50 focus:bg-white transition-all"
                            />
                            {state.errors?.title && <p className="text-red-500 text-xs mt-1">{state.errors.title}</p>}
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="start_date" className="block text-sm font-semibold text-slate-900 mb-2">Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                id="start_date"
                                value={fields.start_date || ''}
                                onChange={handleChange}
                                className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-slate-50 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="end_date" className="block text-sm font-semibold text-slate-900 mb-2">End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                id="end_date"
                                value={fields.end_date || ''}
                                onChange={handleChange}
                                className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-slate-50 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="from_city" className="block text-sm font-semibold text-slate-900 mb-2">From</label>
                            <input
                                type="text"
                                name="from_city"
                                id="from_city"
                                value={fields.from_city || ''}
                                onChange={handleChange}
                                className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-slate-50 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="to_place" className="block text-sm font-semibold text-slate-900 mb-2">To</label>
                            <input
                                type="text"
                                name="to_place"
                                id="to_place"
                                value={fields.to_place || ''}
                                onChange={handleChange}
                                className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-slate-50 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="price_amount" className="block text-sm font-semibold text-slate-900 mb-2">Price</label>
                            <input
                                type="number"
                                name="price_amount"
                                id="price_amount"
                                value={fields.price_amount || ''}
                                onChange={handleChange}
                                className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-slate-50 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="price_currency" className="block text-sm font-semibold text-slate-900 mb-2">Currency</label>
                            <select
                                name="price_currency"
                                id="price_currency"
                                value={fields.price_currency || 'PLN'}
                                onChange={handleChange}
                                className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-slate-50 focus:bg-white transition-all"
                            >
                                <option value="PLN">PLN</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="seats_total" className="block text-sm font-semibold text-slate-900 mb-2">Seats</label>
                            <input
                                type="number"
                                name="seats_total"
                                id="seats_total"
                                value={fields.seats_total || ''}
                                onChange={handleChange}
                                className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-slate-50 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="sm:col-span-6">
                            <label htmlFor="description_clean" className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                            <textarea
                                name="description_clean"
                                id="description_clean"
                                rows={6}
                                value={fields.description_clean || ''}
                                onChange={handleChange}
                                className="block w-full rounded-lg border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-slate-50 focus:bg-white transition-all"
                            />
                        </div>

                    </div>

                    {state.message && (
                        <div className="p-4 bg-red-50 text-red-700 rounded text-sm">
                            {state.message}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            name="status"
                            value="draft"
                            disabled={isPending}
                            className="rounded-lg bg-white py-2.5 px-5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all font-medium"
                        >
                            Save as Draft
                        </button>
                        <button
                            type="submit"
                            name="status"
                            value="published"
                            disabled={isPending}
                            className="rounded-lg bg-indigo-600 py-2.5 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-500 transition-all mb-1"
                        >
                            {isPending ? 'Publishing...' : 'Publish Trip'}
                        </button>
                    </div>
                </form>
            </div>
        </PageContainer>
    )
}
