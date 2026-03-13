'use client'

import { ParsedTripFields } from '@/lib/types'

interface TripDetailsFormProps {
    fields: ParsedTripFields
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
    errors?: Record<string, string[]>
}

export function TripDetailsForm({ fields, onChange, errors }: TripDetailsFormProps) {
    return (
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
                    onChange={onChange}
                    placeholder="e.g. Skiing in Alps"
                    className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all font-medium text-lg"
                />
                {errors?.title && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.title}</p>}
            </div>

            {/* Price & Currency */}
            <div className="lg:col-span-1 space-y-2">
                <label htmlFor="price_amount" className="block text-sm font-bold text-slate-700 ml-1">Price</label>
                <input
                    type="number"
                    name="price_amount"
                    id="price_amount"
                    value={fields.price_amount || ''}
                    onChange={onChange}
                    className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                />
            </div>
            <div className="lg:col-span-1 space-y-2">
                <label htmlFor="price_currency" className="block text-sm font-bold text-slate-700 ml-1">Currency</label>
                <select
                    name="price_currency"
                    id="price_currency"
                    value={fields.price_currency || 'PLN'}
                    onChange={onChange}
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
                    onChange={onChange}
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
                    onChange={onChange}
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
                    onChange={onChange}
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
                    onChange={onChange}
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
                    onChange={onChange}
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
                    onChange={onChange}
                    className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 bg-white ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all resize-none leading-relaxed"
                />
            </div>
        </div>
    )
}
