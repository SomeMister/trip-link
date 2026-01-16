import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageContainer } from '@/components/ui/PageContainer'
import { ApplicationForm } from '@/components/ApplicationForm'
import { Calendar, MapPin, Users, Banknote } from 'lucide-react'

export default async function PublicTripPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = createClient()

    const { data: trip, error } = await (await supabase)
        .from('trips')
        .select('*')
        .eq('slug', slug)
        // .eq('status', 'published') // removed to allow handling closed state
        .single()

    if (error || !trip) {
        notFound()
    }

    // Handle Closed State
    if (trip.status === 'closed') {
        return (
            <PageContainer>
                <div className="max-w-2xl mx-auto text-center py-20">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">{trip.title}</h1>
                    <div className="bg-gray-100 rounded-lg p-8 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Trip Closed</h2>
                        <p className="mt-2 text-gray-600">This trip is no longer accepting applications.</p>
                    </div>
                </div>
            </PageContainer>
        )
    }

    // Handle Draft State (should not be public)
    if (trip.status === 'draft') {
        notFound()
    }

    const isFull = trip.seats_left !== null && trip.seats_left <= 0

    return (
        <PageContainer>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Left Column: Trip Details */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{trip.title}</h1>
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                            <div className="flex items-center">
                                <MapPin className="mr-1.5 h-5 w-5 text-indigo-500" />
                                {trip.from_city} &rarr; {trip.to_place}
                            </div>
                            <div className="flex items-center">
                                <Calendar className="mr-1.5 h-5 w-5 text-indigo-500" />
                                {trip.start_date} {trip.end_date ? `- ${trip.end_date}` : ''}
                            </div>
                        </div>
                    </div>

                    {/* Cover Image (Placeholder if needed, or if we had one) */}
                    {trip.cover_image_url && (
                        <div className="aspect-video w-full rounded-lg bg-slate-100 overflow-hidden relative">
                            {/* Next/Image would be better, but standard img for MVP if external url */}
                            <img src={trip.cover_image_url} alt={trip.title} className="object-cover w-full h-full" />
                        </div>
                    )}

                    {/* Description */}
                    <div className="prose prose-slate max-w-none">
                        <h3 className="text-lg font-semibold text-slate-900">About this trip</h3>
                        <p className="whitespace-pre-wrap text-slate-700 leading-relaxed mt-2">
                            {trip.description_clean}
                        </p>
                    </div>

                </div>

                {/* Right Column: Key Info & Action */}
                <div className="space-y-8">

                    {/* At a Glance Box */}
                    <div className="bg-slate-50 rounded-lg p-6 ring-1 ring-slate-200 space-y-4">
                        <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">Trip Details</h3>

                        <div className="flex justify-between items-center py-1">
                            <div className="flex items-center text-slate-600">
                                <Banknote className="mr-2 h-5 w-5 text-slate-400" />
                                <span>Price</span>
                            </div>
                            <span className="font-medium text-slate-900">
                                {trip.price_amount ? `${trip.price_amount} ${trip.price_currency}` : 'Free/TBD'}
                            </span>
                        </div>

                        <div className="flex justify-between items-center py-1">
                            <div className="flex items-center text-slate-600">
                                <Users className="mr-2 h-5 w-5 text-slate-400" />
                                <span>Spots</span>
                            </div>
                            <span className={`font-medium ${isFull ? 'text-red-600' : 'text-slate-900'}`}>
                                {trip.seats_left !== null ? `${trip.seats_left} remaining` : 'Open'}
                            </span>
                        </div>
                    </div>

                    {/* Application Form */}
                    {isFull ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                            <h3 className="text-lg font-medium text-red-900">Fully Booked</h3>
                            <p className="mt-2 text-sm text-red-700">
                                Sorry, there are no more seats available for this trip.
                            </p>
                        </div>
                    ) : (
                        <ApplicationForm tripId={trip.id} />
                    )}

                </div>

            </div>
        </PageContainer>
    )
}
