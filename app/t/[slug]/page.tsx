import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ApplicationForm } from '@/components/ApplicationForm'
import { Carousel } from '@/components/ui/Carousel'
import { CalendarDays, MapPin, Coins, Users } from "lucide-react"
import { MobileStickyCTA } from "@/components/MobileStickyCTA"

export const dynamic = 'force-dynamic'

export default async function PublicTripPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params
    const supabase = await createClient()

    const { data: trip, error } = await supabase
        .from('trips')
        .select(`
            *,
            trip_images (
                id,
                storage_path,
                position
            )
        `)
        .ilike('slug', resolvedParams.slug) // Возвращаем ilike для надежности
        .eq('status', 'published')
        .single()

    if (error || !trip) {
        notFound()
    }

    // Сортировка изображений
    const orderedImages = trip.trip_images?.sort((a: any, b: any) => a.position - b.position) || []
    const isFull = trip.seats_left !== null && trip.seats_left <= 0

    return (
        <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
            {/* Контейнер для карусели */}
            <div className="max-w-5xl mx-auto lg:pt-8 lg:px-8">
                {orderedImages.length > 0 ? (
                    <Carousel images={orderedImages} className="lg:rounded-3xl" />
                ) : trip.cover_image_url ? (
                    <div className="h-72 md:h-[400px] w-full lg:rounded-3xl overflow-hidden shadow-sm">
                        <img src={trip.cover_image_url} alt={trip.title} className="object-cover w-full h-full" />
                    </div>
                ) : null}
            </div>

            <main className="max-w-5xl mx-auto px-4 py-8 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
                                {trip.title}
                            </h1>

                            <div className="flex flex-wrap items-center">
                                {trip.start_date && (
                                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 text-sm font-semibold text-slate-700">
                                        <CalendarDays className="h-4 w-4 text-teal-600" />
                                        {trip.start_date} {trip.end_date ? `— ${trip.end_date}` : ''}
                                    </div>
                                )}
                                {trip.to_place && (
                                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 text-sm font-semibold text-slate-700">
                                        <MapPin className="h-4 w-4 text-teal-600" />
                                        {trip.to_place}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 text-sm font-semibold text-slate-700">
                                    <Coins className="h-4 w-4 text-teal-600" />
                                    {trip.price_amount ? `${trip.price_amount} ${trip.price_currency}` : 'Цена не указана'}
                                </div>
                                {(trip.seats_left !== null || isFull) && (
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border text-sm font-semibold ${isFull
                                        ? 'bg-white border-rose-100 text-rose-700'
                                        : 'bg-white border-emerald-100 text-emerald-700'
                                        }`}>
                                        <Users className={`h-4 w-4 ${isFull ? 'text-rose-600' : 'text-emerald-600'}`} />
                                        {isFull ? 'Все места заняты' : `Осталось ${trip.seats_left} мест`}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">О поездке</h3>
                            <div className="prose prose-slate max-w-none">
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {trip.description_clean || trip.description_raw}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div id="application-section" className="space-y-6 scroll-mt-6 lg:mt-24">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">

                            {isFull ? (
                                <div className="text-center py-4 px-4 bg-rose-50 rounded-2xl text-rose-700 font-medium">
                                    К сожалению, мест больше нет. Но вы можете записаться в лист ожидания.
                                </div>
                            ) : (
                                <ApplicationForm tripId={trip.id} />
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <MobileStickyCTA seatsLeft={trip.seats_left} isFull={isFull} />
        </div>
    )
}