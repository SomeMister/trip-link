import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PageContainer } from '@/components/ui/PageContainer'
import { Plus, Users, Map, Calendar, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: trips } = await supabase
        .from('trips')
        .select('*')
        .eq('owner_id', user?.id || '')
        .order('created_at', { ascending: false })

    // Calculate Stats
    const totalTrips = trips?.length || 0
    const activeTrips = trips?.filter(t => t.status === 'published').length || 0
    const totalSeats = trips?.reduce((acc, t) => acc + (t.seats_total || 0), 0) || 0
    const seatsLeft = trips?.reduce((acc, t) => acc + (t.seats_left || 0), 0) || 0

    return (
        <PageContainer>
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage your trips and applications</p>
                </div>
                <Link
                    href="/dashboard/trips/new"
                    className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-500 transition-all hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4" />
                    Create Trip
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    label="Total Trips"
                    value={totalTrips}
                    icon={<Map className="w-5 h-5 text-indigo-600" />}
                    bg="bg-indigo-50"
                />
                <StatCard
                    label="Active Trips"
                    value={activeTrips}
                    icon={<Calendar className="w-5 h-5 text-emerald-600" />}
                    bg="bg-emerald-50"
                />
                <StatCard
                    label="Total Capacity"
                    value={totalSeats}
                    icon={<Users className="w-5 h-5 text-blue-600" />}
                    bg="bg-blue-50"
                />
                <StatCard
                    label="Open Seats"
                    value={seatsLeft}
                    icon={<Users className="w-5 h-5 text-amber-600" />}
                    bg="bg-amber-50"
                />
            </div>

            {/* Recent Trips Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900">Recent Trips</h3>
                </div>

                {!trips || trips.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="mx-auto h-12 w-12 text-slate-300 mb-3">
                            <Map className="w-full h-full" />
                        </div>
                        <p className="text-slate-500">No trips created yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 font-medium">
                                    <th className="px-6 py-4">Trip Title</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Route</th>
                                    <th className="px-6 py-4">Dates</th>
                                    <th className="px-6 py-4">Occupancy</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {trips.map((trip) => (
                                    <tr
                                        key={trip.id}
                                        className="hover:bg-slate-50/80 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{trip.title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${trip.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                                                trip.status === 'closed' ? 'bg-slate-100 text-slate-600' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-1">
                                                {trip.from_city} <ArrowRight className="w-3 h-3 text-slate-400" /> {trip.to_place}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {trip.start_date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full"
                                                        style={{ width: `${((trip.seats_total - trip.seats_left) / trip.seats_total) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">{trip.seats_total - trip.seats_left}/{trip.seats_total}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/trips/${trip.id}`}
                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Manage
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </PageContainer>
    )
}

function StatCard({ label, value, icon, bg }: { label: string, value: number, icon: React.ReactNode, bg: string }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${bg}`}>
                {icon}
            </div>
        </div>
    )
}
