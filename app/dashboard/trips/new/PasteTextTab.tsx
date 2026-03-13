'use client'

import { Wand2 } from 'lucide-react'

interface PasteTextTabProps {
    rawText: string
    onRawTextChange: (text: string) => void
    onParse: () => void
}

export function PasteTextTab({ rawText, onRawTextChange, onParse }: PasteTextTabProps) {
    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <textarea
                className="w-full h-48 p-5 rounded-2xl border-0 bg-slate-50 ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all resize-none text-slate-900 leading-relaxed text-base"
                placeholder="Paste a trip post, Instagram caption, or Telegram message here..."
                value={rawText}
                onChange={(e) => onRawTextChange(e.target.value)}
            />
            <button
                type="button"
                onClick={onParse}
                disabled={!rawText.trim()}
                className="w-full py-4 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 text-lg font-bold shadow-lg shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Auto-Fill Trip
            </button>
        </div>
    )
}
