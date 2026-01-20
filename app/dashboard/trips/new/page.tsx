'use client'

import { useActionState, useState } from 'react'
import { createTrip, CreateTripState } from '../actions'
import { extractTripDetails } from '@/lib/extractFromText'
import { ParsedTripFields } from '@/lib/types'
import { PageContainer } from '@/components/ui/PageContainer'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Wand2, Import, Type, Link as LinkIcon, Edit3 } from 'lucide-react'

const initialState: CreateTripState = { message: null, errors: {} }

export default function NewTripPage() {
    const [state, formAction, isPending] = useActionState(createTrip, initialState)
    const [activeTab, setActiveTab] = useState<'paste' | 'telegram' | 'manual'>('paste')

    // Inputs
    const [rawText, setRawText] = useState('')
    const [telegramUrl, setTelegramUrl] = useState('')
    const [loadingImport, setLoadingImport] = useState(false)
    const [importError, setImportError] = useState<string | null>(null)

    const [fields, setFields] = useState<ParsedTripFields>({})

    // Handler for Paste Text - Auto-fills form state only
    const handlePasteParse = () => {
        const { fields: extracted } = extractTripDetails(rawText)
        setFields(prev => ({ ...prev, ...extracted }))
    }

    // Handler for Telegram Import - Auto-fills form state only
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
            <form action={formAction} className="max-w-6xl mx-auto space-y-12">
                <input type="hidden" name="description_raw" value={rawText} />

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create New Trip</h1>
                    <p className="text-slate-500 font-medium text-lg">Paste your trip details and let AI handle the rest</p>
                </div>

                {/* Hero Section: Grid 2 Cols */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

                    {/* Left Col: Input Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 flex flex-col">

                        {/* Tabs */}
                        <div className="flex p-1.5 bg-slate-50 rounded-2xl mb-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('paste')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'paste' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-700'}`}
                            >
                                <Type size={16} />
                                <span className="hidden sm:inline">Paste Text</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('telegram')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'telegram' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-700'}`}
                            >
                                <LinkIcon size={16} />
                                <span className="hidden sm:inline">Telegram Link</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('manual')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'manual' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-700'}`}
                            >
                                <Edit3 size={16} />
                                <span className="hidden sm:inline">Manual</span>
                            </button>
                        </div>

                        {/* Card Content */}
                        <div className="flex-1 p-6 flex flex-col justify-center">
                            {activeTab === 'paste' && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <textarea
                                        className="w-full h-48 p-5 rounded-2xl border-0 bg-slate-50 ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all resize-none text-slate-900 leading-relaxed text-base"
                                        placeholder="Paste a trip post, Instagram caption, or Telegram message here..."
                                        value={rawText}
                                        onChange={(e) => setRawText(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handlePasteParse}
                                        disabled={!rawText.trim()}
                                        className="w-full py-4 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 text-lg font-bold shadow-lg shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        Auto-Fill Trip
                                    </button>
                                </div>
                            )}

                            {activeTab === 'telegram' && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-900 ml-1">Telegram URL</label>
                                        <input
                                            type="text"
                                            className="w-full p-4 rounded-2xl border-0 bg-slate-50 ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-900"
                                            placeholder="https://t.me/channel/123"
                                            value={telegramUrl}
                                            onChange={(e) => setTelegramUrl(e.target.value)}
                                        />
                                    </div>
                                    {importError && (
                                        <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium border border-rose-100 text-center">
                                            {importError}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleTelegramImport}
                                        disabled={loadingImport || !telegramUrl.trim()}
                                        className="w-full py-4 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 text-lg font-bold shadow-lg shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingImport ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Import className="w-5 h-5" />
                                        )}
                                        {loadingImport ? 'Importing...' : 'Auto-Fill from Link'}
                                    </button>
                                </div>
                            )}

                            {activeTab === 'manual' && (
                                <div className="text-center py-12 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <Edit3 size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Manual Mode</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto">
                                        Skip the magic. Fill in the trip details in the section below.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col: Media Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col h-full min-h-[400px]">
                        <ImageUpload name="photos" maxFiles={5} className="h-full flex flex-col" />
                    </div>

                </div>

                {/* Secondary Section: Details */}
                <div className="space-y-6 pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <h2 className="text-slate-400 font-bold uppercase tracking-wider text-sm">Trip Details</h2>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">

                        {/* Title - Full Width */}
                        <div className="lg:col-span-4 space-y-2">
                            <label htmlFor="title" className="block text-sm font-bold text-slate-700 ml-1">Trip Title</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                value={fields.title || ''}
                                onChange={handleChange}
                                placeholder="e.g. Skiing in Alps"
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all font-medium text-lg"
                            />
                            {state.errors?.title && <p className="text-rose-500 text-xs mt-1 font-bold">{state.errors.title}</p>}
                        </div>

                        {/* Price & Currency */}
                        <div className="lg:col-span-1 space-y-2">
                            <label htmlFor="price_amount" className="block text-sm font-bold text-slate-700 ml-1">Price</label>
                            <input
                                type="number"
                                name="price_amount"
                                id="price_amount"
                                value={fields.price_amount || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                            />
                        </div>
                        <div className="lg:col-span-1 space-y-2">
                            <label htmlFor="price_currency" className="block text-sm font-bold text-slate-700 ml-1">Currency</label>
                            <select
                                name="price_currency"
                                id="price_currency"
                                value={fields.price_currency || 'PLN'}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 transition-all font-medium appearance-none"
                            >
                                <option value="PLN">PLN</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="BYN">BYN</option>
                                <option value="RUB">RUB</option>
                            </select>
                        </div>

                        {/* Route */}
                        <div className="lg:col-span-2 space-y-2">
                            <label htmlFor="from_city" className="block text-sm font-bold text-slate-700 ml-1">From</label>
                            <input
                                type="text"
                                name="from_city"
                                id="from_city"
                                value={fields.from_city || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                            />
                        </div>
                        <div className="lg:col-span-2 space-y-2">
                            <label htmlFor="to_place" className="block text-sm font-bold text-slate-700 ml-1">To</label>
                            <input
                                type="text"
                                name="to_place"
                                id="to_place"
                                value={fields.to_place || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                            />
                        </div>

                        {/* Dates */}
                        <div className="lg:col-span-1 space-y-2">
                            <label htmlFor="start_date" className="block text-sm font-bold text-slate-700 ml-1">Start</label>
                            <input
                                type="date"
                                name="start_date"
                                id="start_date"
                                value={fields.start_date || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                            />
                        </div>
                        <div className="lg:col-span-1 space-y-2">
                            <label htmlFor="end_date" className="block text-sm font-bold text-slate-700 ml-1">End</label>
                            <input
                                type="date"
                                name="end_date"
                                id="end_date"
                                value={fields.end_date || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                            />
                        </div>

                        {/* Total Seats */}
                        <div className="md:col-span-2 lg:col-span-2 space-y-2">
                            <label htmlFor="seats_total" className="block text-sm font-bold text-slate-700 ml-1">Total Seats</label>
                            <input
                                type="number"
                                name="seats_total"
                                id="seats_total"
                                value={fields.seats_total || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                            />
                        </div>

                        {/* Description */}
                        <div className="lg:col-span-6 space-y-2">
                            <label htmlFor="description_clean" className="block text-sm font-bold text-slate-700 ml-1">Description</label>
                            <textarea
                                name="description_clean"
                                id="description_clean"
                                rows={6}
                                value={fields.description_clean || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all resize-none leading-relaxed"
                            />
                        </div>

                    </div>

                    {/* Error Message */}
                    {state.message && (
                        <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-sm font-bold border border-rose-100">
                            {state.message}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 pt-4 pb-12">
                        <button
                            type="submit"
                            name="status"
                            value="draft"
                            disabled={isPending}
                            className="px-8 py-3 rounded-xl bg-white text-slate-600 font-bold text-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Save Draft
                        </button>
                        <button
                            type="submit"
                            name="status"
                            value="published"
                            disabled={isPending}
                            className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            {isPending ? 'Publishing...' : 'Publish Trip'}
                        </button>
                    </div>

                </div>
            </form>
        </PageContainer>
    )
}
