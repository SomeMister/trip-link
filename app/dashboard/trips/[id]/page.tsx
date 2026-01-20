import { createClient } from '@/lib/supabase/server'
import { PageContainer } from '@/components/ui/PageContainer'
import { notFound } from 'next/navigation'
import { ApplicationCard } from '@/components/ApplicationCard'
import { CloseTripButton } from './CloseTripButton'
import { Carousel } from '@/components/ui/Carousel'
import { Users, UserCheck, Clock, Armchair, MapPin, Calendar, Banknote } from 'lucide-react'

export default async function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch Trip
    const { data: trip, error } = await supabase
        .from('trips')
        .select(`
            *,
            trip_images (
                storage_path,
                position
            )
        `)
        .eq('id', id)
        .single()

    if (error || !trip) {
        notFound()
    }

    // Fetch Applications 
    const { data: applications } = await supabase
        .from('applications')
        .select('*')
        .eq('trip_id', id)
        .order('created_at', { ascending: false })

    // Calculate Trip Stats
    const totalApps = applications?.length || 0
    const approvedApps = applications?.filter(a => a.status === 'approved').length || 0
    const waitlistApps = applications?.filter(a => a.status === 'waitlist').length || 0
    const pendingApps = applications?.filter(a => a.status === 'new').length || 0
    const occupancy = trip.seats_total ? Math.round(((trip.seats_total - trip.seats_left) / trip.seats_total) * 100) : 0

    // Sort images
    const orderedImages = trip.trip_images?.sort((a: any, b: any) => a.position - b.position) || []

    return (
        <PageContainer>
            {/* Header & Status */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 pb-6 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{trip.title}</h1>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${trip.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                            trip.status === 'closed' ? 'bg-slate-100 text-slate-600' :
                                'bg-amber-100 text-amber-700'
                            }`}>
                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                        </span>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-3">
                    <a
                        href={`/t/${trip.slug}`}
                        target="_blank"
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        View Public Page
                    </a>
                    {trip.status !== 'closed' && (
                        <CloseTripButton tripId={trip.id} />
                    )}
                </div>
            </div>

            {/* Main Content Grid: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Column (2/3): Inbox Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Inbox Заявок</h2>
                        <span className="text-sm font-medium text-slate-500">{applications?.length || 0} всего</span>
                    </div>

                    {!applications || applications.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 border-dashed">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Заявок пока нет</h3>
                            <p className="text-slate-500">Поделитесь ссылкой на поездку, чтобы получить первые отклики.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {applications.map((app) => (
                                <ApplicationCard key={app.id} application={app} tripId={trip.id} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column (1/3): Summary (Sticky) */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:sticky lg:top-8">
                        {/* Mini Carousel/Cover */}
                        <div className="mb-6 rounded-2xl overflow-hidden aspect-video bg-slate-100 relative">
                            {orderedImages.length > 0 ? (
                                <Carousel images={orderedImages} className="w-full h-full" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase">
                                    Нет фото
                                </div>
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-4">Сводка поездки</h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-xl">
                                    <MapPin className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Локация</div>
                                    <div className="font-semibold text-slate-900">{trip.to_place || 'Не указана'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-xl">
                                    <Calendar className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Даты</div>
                                    <div className="font-semibold text-slate-900">{trip.start_date || 'TBD'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-xl">
                                    <Banknote className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Цена</div>
                                    <div className="font-semibold text-slate-900">{trip.price_amount ? `${trip.price_amount} ${trip.price_currency}` : 'Не указана'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-xl">
                                    <UserCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Одобрено</div>
                                    <div className="font-semibold text-slate-900">{approvedApps} / {trip.seats_total || '?'} мест</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-50">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Описание</div>
                            <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed">
                                {trip.description_clean || 'Описания нет'}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </PageContainer >
    )
}

function StatCard({ label, value, subtext, icon, bg }: { label: string, value: string | number, subtext?: string, icon: React.ReactNode, bg: string }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                    {subtext && <span className="text-xs text-slate-500">{subtext}</span>}
                </div>
            </div>
            <div className={`p-2.5 rounded-lg ${bg}`}>
                {icon}
            </div>
        </div>
    )
}
