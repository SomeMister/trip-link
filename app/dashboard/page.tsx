import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { TripCard } from '@/components/dashboard/TripCard'

export default async function DashboardPage() {
    const supabase = await createClient()

    // Получаем поездки вместе со статусами заявок для бейджей
    const { data: trips } = await supabase
        .from('trips')
        .select('*, applications(status), trip_images(storage_path, position)')
        .order('created_at', { ascending: false })

    // Сбор статистики
    const totalTrips = trips?.length || 0
    const activeTrips = trips?.filter(t => t.status === 'published').length || 0
    const totalCapacity = trips?.reduce((acc, t) => acc + (t.seats_total || 0), 0) || 0
    const totalOpenSeats = trips?.reduce((acc, t) => acc + (t.seats_left || 0), 0) || 0

    const stats = [
        { label: 'Total Trips', value: totalTrips, icon: '🌍', color: 'bg-blue-50 text-blue-600' },
        { label: 'Published', value: activeTrips, icon: '✅', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Total Seats', value: totalCapacity, icon: '👥', color: 'bg-purple-50 text-purple-600' },
        { label: 'Available', value: totalOpenSeats, icon: '🎟️', color: 'bg-amber-50 text-amber-600' },
    ]

    return (
        <div className="space-y-10 pb-12">
            {/* Хедер дашборда */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Dashboard</h1>
                    <p className="text-slate-500 font-medium">Manage your trips and applications</p>
                </div>
                <Link
                    href="/dashboard/trips/new"
                    className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-teal-600/20 active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    Create Trip
                </Link>
            </div>

            {/* Сетка статистики */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-xl mb-4`}>
                            {stat.icon}
                        </div>
                        <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Список поездок (Сетка) */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Your Trips</h2>
                </div>

                {trips && trips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trips.map((trip) => (
                            <TripCard key={trip.id} trip={trip} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="text-4xl mb-4">📭</div>
                        <h3 className="text-lg font-bold text-slate-900">No trips yet</h3>
                        <p className="text-slate-500 mb-6">Create your first trip to start receiving applications</p>
                        <Link
                            href="/dashboard/trips/new"
                            className="text-teal-600 font-bold hover:underline"
                        >
                            Create now &rarr;
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}