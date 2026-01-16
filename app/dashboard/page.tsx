import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PageContainer, PageHeader } from '@/components/ui/PageContainer'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: trips } = await supabase
        .from('trips')
        .select('*')
        .eq('owner_id', user?.id || '')
        .order('created_at', { ascending: false })

    return (
        <PageContainer>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Your Trips</h1>
                <Link
                    href="/dashboard/trips/new"
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Create Trip
                </Link>
            </div>

            {!trips || trips.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow ring-1 ring-slate-200">
                    <p className="text-slate-500">No trips created yet.</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md ring-1 ring-slate-200">
                    <ul role="list" className="divide-y divide-slate-200">
                        {trips.map((trip) => (
                            <li key={trip.id}>
                                <Link href={`/dashboard/trips/${trip.id}`} className="block hover:bg-slate-50">
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="truncate text-sm font-medium text-indigo-600">
                                                {trip.title}
                                            </p>
                                            <div className="ml-2 flex flex-shrink-0">
                                                <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${trip.status === 'published'
                                                        ? 'bg-green-100 text-green-800'
                                                        : trip.status === 'closed'
                                                            ? 'bg-gray-100 text-gray-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {trip.status}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-slate-600">
                                                    {trip.from_city} &rarr; {trip.to_place}
                                                </p>
                                                <p className="mt-2 flex items-center text-sm text-slate-600 sm:mt-0 sm:ml-6">
                                                    {trip.start_date}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-slate-600 sm:mt-0">
                                                <p>
                                                    {trip.seats_left} / {trip.seats_total} seats left
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </PageContainer>
    )
}
