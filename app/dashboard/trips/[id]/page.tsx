import { createClient } from '@/lib/supabase/server'
import { PageContainer } from '@/components/ui/PageContainer'
import { notFound } from 'next/navigation'
import { InboxApplicationRow } from './InboxApplicationRow'
import { CloseTripButton } from './CloseTripButton'
import { Users, UserCheck, Clock, Armchair, MapPin, Calendar, Banknote } from 'lucide-react'

export default async function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch Trip
    const { data: trip, error } = await supabase
        .from('trips')
        .select('*')
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
                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        View Public Page
                    </a>
                    {trip.status !== 'closed' && (
                        <CloseTripButton tripId={trip.id} />
                    )}
                </div>
            </div>

            {/* Trip Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Seats Left"
                    value={`${trip.seats_left}/${trip.seats_total}`}
                    subtext={`${occupancy}% Full`}
                    icon={<Armchair className="w-5 h-5 text-indigo-600" />}
                    bg="bg-indigo-50"
                />
                <StatCard
                    label="Pending Review"
                    value={pendingApps}
                    icon={<Clock className="w-5 h-5 text-amber-600" />}
                    bg="bg-amber-50"
                />
                <StatCard
                    label="Approved"
                    value={approvedApps}
                    icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
                    bg="bg-emerald-50"
                />
                <StatCard
                    label="Total Apps"
                    value={totalApps}
                    icon={<Users className="w-5 h-5 text-blue-600" />}
                    bg="bg-blue-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Inbox */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Applications</h2>
                    </div>

                    {/* Inbox List */}
                    <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-xl overflow-hidden overflow-x-auto">
                        {!applications || applications.length === 0 ? (
                            <div className="p-16 text-center">
                                <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-500">No applications received yet.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Seats</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {applications.map((app) => (
                                        <InboxApplicationRow key={app.id} app={app} tripId={trip.id} />
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right: Details Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6 pb-4 border-b border-slate-50">Trip Summary</h3>

                        <dl className="space-y-6">
                            <div className="flex gap-4">
                                <div className="p-2 bg-slate-50 rounded-lg h-fit">
                                    <MapPin className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-slate-500 uppercase">Route</dt>
                                    <dd className="mt-1 text-sm text-slate-900 font-medium">{trip.from_city} &rarr; {trip.to_place}</dd>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="p-2 bg-slate-50 rounded-lg h-fit">
                                    <Calendar className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-slate-500 uppercase">Dates</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{trip.start_date} {trip.end_date ? `- ${trip.end_date}` : ''}</dd>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="p-2 bg-slate-50 rounded-lg h-fit">
                                    <Banknote className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-slate-500 uppercase">Price</dt>
                                    <dd className="mt-1 text-lg font-bold text-slate-900">
                                        {trip.price_amount ? `${trip.price_amount} ${trip.price_currency}` : 'Free / TBD'}
                                    </dd>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                                <dt className="text-xs font-medium text-slate-500 uppercase mb-2">Description</dt>
                                <dd className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{trip.description_clean}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

            </div>
        </PageContainer>
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
