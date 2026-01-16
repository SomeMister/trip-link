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
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('paste')}
                            className={`${activeTab === 'paste' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'} whitespace-nowrap border-b-2 py-4 px-1 text-base font-medium`}
                        >
                            Paste Text
                        </button>
                        <button
                            onClick={() => setActiveTab('telegram')}
                            className={`${activeTab === 'telegram' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'} whitespace-nowrap border-b-2 py-4 px-1 text-base font-medium`}
                        >
                            Telegram URL
                        </button>
                    </nav>
                </div>

                {/* Import Area */}
                <div className="bg-white p-6 rounded shadow mb-8">
                    {activeTab === 'paste' ? (
                        <>
                            <label className="block text-base font-semibold text-gray-900 mb-3">
                                Paste Post Text
                            </label>
                            <textarea
                                className="w-full h-32 p-3 border border-gray-300 rounded-md mb-4 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-indigo-600 focus:border-indigo-600"
                                placeholder="Paste your Instagram/Facebook text here..."
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handlePasteParse}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                            >
                                Auto-Fill Form
                            </button>
                        </>
                    ) : (
                        <>
                            <label className="block text-base font-semibold text-gray-900 mb-3">
                                Telegram Message URL
                            </label>
                            {importError && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">
                                    {importError}
                                </div>
                            )}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    className="flex-1 p-3 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:ring-indigo-600 focus:border-indigo-600"
                                    placeholder="https://t.me/channel/123"
                                    value={telegramUrl}
                                    onChange={(e) => setTelegramUrl(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleTelegramImport}
                                    disabled={loadingImport}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium disabled:opacity-50"
                                >
                                    {loadingImport ? 'Importing...' : 'Import'}
                                </button>
                            </div>
                            {rawText && (
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 mb-1">Imported Text Preview:</p>
                                    <textarea
                                        className="w-full h-24 p-2 border rounded bg-gray-50 text-sm"
                                        value={rawText}
                                        readOnly
                                    />
                                </div>
                            )}
                        </>
                    )}

                </div>

                {/* Step 2: Form */}
                <form action={formAction} className="bg-white p-6 rounded shadow space-y-6">
                    <input type="hidden" name="description_raw" value={rawText} />

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                        <div className="sm:col-span-4">
                            <label htmlFor="title" className="block text-sm font-semibold text-gray-900">Trip Title</label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="title"
                                    id="title"
                                    required
                                    value={fields.title || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-300 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm border p-2.5"
                                />
                            </div>
                            {state.errors?.title && <p className="text-red-500 text-xs mt-1">{state.errors.title}</p>}
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="start_date" className="block text-sm font-semibold text-gray-900">Start Date</label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="start_date"
                                    id="start_date"
                                    value={fields.start_date || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-300 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm border p-2.5"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="end_date" className="block text-sm font-semibold text-gray-900">End Date</label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="end_date"
                                    id="end_date"
                                    value={fields.end_date || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-300 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm border p-2.5"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="from_city" className="block text-sm font-semibold text-gray-900">From</label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="from_city"
                                    id="from_city"
                                    value={fields.from_city || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-300 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm border p-2.5"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="to_place" className="block text-sm font-semibold text-gray-900">To</label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="to_place"
                                    id="to_place"
                                    value={fields.to_place || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-300 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm border p-2.5"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="price_amount" className="block text-sm font-semibold text-gray-900">Price</label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    name="price_amount"
                                    id="price_amount"
                                    value={fields.price_amount || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-300 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm border p-2.5"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="price_currency" className="block text-sm font-semibold text-gray-900">Currency</label>
                            <div className="mt-2">
                                <select
                                    name="price_currency"
                                    id="price_currency"
                                    value={fields.price_currency || 'PLN'}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-300 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm border p-2.5"
                                >
                                    <option value="PLN">PLN</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="seats_total" className="block text-sm font-semibold text-gray-900">Seats</label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    name="seats_total"
                                    id="seats_total"
                                    value={fields.seats_total || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-300 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm border p-2.5"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-6">
                            <label htmlFor="description_clean" className="block text-sm font-semibold text-gray-900">Description</label>
                            <div className="mt-2">
                                <textarea
                                    name="description_clean"
                                    id="description_clean"
                                    rows={4}
                                    value={fields.description_clean || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-300 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm border p-2.5"
                                />
                            </div>
                        </div>

                    </div>

                    {state.message && (
                        <div className="p-4 bg-red-50 text-red-700 rounded text-sm">
                            {state.message}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="submit"
                            name="status"
                            value="draft"
                            disabled={isPending}
                            className="rounded-md bg-white py-2 px-4 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Save as Draft
                        </button>
                        <button
                            type="submit"
                            name="status"
                            value="published"
                            disabled={isPending}
                            className="rounded-md bg-indigo-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            {isPending ? 'Publishing...' : 'Publish'}
                        </button>
                    </div>
                </form>
            </div>
        </PageContainer>
    )
}
