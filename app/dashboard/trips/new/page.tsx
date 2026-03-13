'use client'

import { useActionState, useState } from 'react'
import { createTrip, CreateTripState } from '../actions'
import { extractTripDetails } from '@/lib/extractFromText'
import { ParsedTripFields } from '@/lib/types'
import { PageContainer } from '@/components/ui/PageContainer'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Type, Link as LinkIcon, Edit3 } from 'lucide-react'
import { PasteTextTab } from './PasteTextTab'
import { TelegramTab } from './TelegramTab'
import { TripDetailsForm } from './TripDetailsForm'

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

    const tabs = [
        { key: 'paste' as const, icon: <Type size={16} />, label: 'Paste Text' },
        { key: 'telegram' as const, icon: <LinkIcon size={16} />, label: 'Telegram Link' },
        { key: 'manual' as const, icon: <Edit3 size={16} />, label: 'Manual' },
    ]

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
                            {tabs.map(({ key, icon, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setActiveTab(key)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-700'}`}
                                >
                                    {icon}
                                    <span className="hidden sm:inline">{label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Card Content */}
                        <div className="flex-1 p-6 flex flex-col justify-center">
                            {activeTab === 'paste' && (
                                <PasteTextTab
                                    rawText={rawText}
                                    onRawTextChange={setRawText}
                                    onParse={handlePasteParse}
                                />
                            )}

                            {activeTab === 'telegram' && (
                                <TelegramTab
                                    telegramUrl={telegramUrl}
                                    onUrlChange={setTelegramUrl}
                                    onImport={handleTelegramImport}
                                    loading={loadingImport}
                                    error={importError}
                                />
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

                    <TripDetailsForm fields={fields} onChange={handleChange} errors={state.errors} />

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
