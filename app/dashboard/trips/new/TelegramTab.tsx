'use client'

import { Import, Link as LinkIcon } from 'lucide-react'

interface TelegramTabProps {
    telegramUrl: string
    onUrlChange: (url: string) => void
    onImport: () => void
    loading: boolean
    error: string | null
}

export function TelegramTab({ telegramUrl, onUrlChange, onImport, loading, error }: TelegramTabProps) {
    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 ml-1">Telegram URL</label>
                <input
                    type="text"
                    className="w-full p-4 rounded-2xl border-0 bg-slate-50 ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-900"
                    placeholder="https://t.me/channel/123"
                    value={telegramUrl}
                    onChange={(e) => onUrlChange(e.target.value)}
                />
            </div>
            {error && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium border border-rose-100 text-center">
                    {error}
                </div>
            )}
            <button
                type="button"
                onClick={onImport}
                disabled={loading || !telegramUrl.trim()}
                className="w-full py-4 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 text-lg font-bold shadow-lg shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Import className="w-5 h-5" />
                )}
                {loading ? 'Importing...' : 'Auto-Fill from Link'}
            </button>
        </div>
    )
}
