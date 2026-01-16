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
                    <div className="bg-white rounded-2xl p-10 shadow-sm ring-1 ring-slate-100">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{trip.title}</h1>
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium mb-6">
                            Trip Closed
                        </div>
                        <p className="text-slate-500">This trip is no longer accepting applications.</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

                {/* Left Column: Trip Details */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-6">{trip.title}</h1>
                        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
                            <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm ring-1 ring-slate-200">
                                <MapPin className="mr-2 h-4 w-4 text-indigo-500" />
                                {trip.from_city} &rarr; {trip.to_place}
                            </div>
                            <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm ring-1 ring-slate-200">
                                <Calendar className="mr-2 h-4 w-4 text-indigo-500" />
                                {trip.start_date} {trip.end_date ? `- ${trip.end_date}` : ''}
                            </div>
                        </div>
                    </div>

                    {/* Cover Image */}
                    {trip.cover_image_url && (
                        <div className="aspect-video w-full rounded-2xl bg-slate-100 overflow-hidden relative shadow-sm">
                            <img src={trip.cover_image_url} alt={trip.title} className="object-cover w-full h-full" />
                        </div>
                    )}

                    {/* Description Card */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            About this trip
                        </h3>
                        <div className="prose prose-slate max-w-none prose-p:leading-relaxed text-slate-600">
                            <p className="whitespace-pre-wrap">{trip.description_clean}</p>
                        </div>
                    </div>

                </div>

                {/* Right Column: Key Info & Action */}
                <div className="space-y-6">

                    {/* At a Glance Box */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-100 space-y-5">
                        <h3 className="font-bold text-slate-900 text-lg">Trip Details</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center text-slate-600 text-sm font-medium">
                                    <Banknote className="mr-3 h-5 w-5 text-slate-400" />
                                    <span>Price</span>
                                </div>
                                <span className="font-bold text-slate-900">
                                    {trip.price_amount ? `${trip.price_amount} ${trip.price_currency}` : 'Free/TBD'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center text-slate-600 text-sm font-medium">
                                    <Users className="mr-3 h-5 w-5 text-slate-400" />
                                    <span>Availability</span>
                                </div>
                                <span className={`font-bold ${isFull ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {trip.seats_left !== null ? `${trip.seats_left} seats left` : 'Open'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Application Form */}
                    {isFull ? (
                        <div className="bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                                <Users className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Simply Fully Booked!</h3>
                            <p className="mt-2 text-sm text-slate-500">
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
