import { createClient } from '@/lib/supabase/server'
import { PageContainer } from '@/components/ui/PageContainer'
import { notFound } from 'next/navigation'
import { InboxApplicationRow } from './InboxApplicationRow'
import { CloseTripButton } from './CloseTripButton'

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

    return (
        <PageContainer>

            {/* Header & Status */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{trip.title}</h1>
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${trip.status === 'published' ? 'bg-green-100 text-green-800' :
                            trip.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                        </span>
                        <span className="text-slate-600">
                            {trip.seats_left} / {trip.seats_total} seats left
                        </span>
                        <a href={`/t/${trip.slug}`} target="_blank" className="text-indigo-600 hover:text-indigo-900 underline">
                            View Public Page
                        </a>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-3">
                    {/* Edit not active for MVP, but placeholder logic */}
                    <button disabled className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50">
                        Edit
                    </button>
                    {trip.status !== 'closed' && (
                        <CloseTripButton tripId={trip.id} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Inbox */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-lg font-semibold text-slate-900">Inbox</h2>

                    {/* Inbox List */}
                    <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-lg overflow-hidden overflow-x-auto">
                        {!applications || applications.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-slate-500">No applications yet.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Name/Note</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Seats</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Contact</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
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
                    <div className="bg-slate-50 p-6 rounded-lg ring-1 ring-slate-200">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Trip Details</h3>

                        <dl className="space-y-4">
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase">Route</dt>
                                <dd className="mt-1 text-sm text-slate-900 font-medium">{trip.from_city} &rarr; {trip.to_place}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase">Dates</dt>
                                <dd className="mt-1 text-sm text-slate-900">{trip.start_date} {trip.end_date ? `- ${trip.end_date}` : ''}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase">Price</dt>
                                <dd className="mt-1 text-sm text-slate-900">
                                    {trip.price_amount ? `${trip.price_amount} ${trip.price_currency}` : 'Free / TBD'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase">Description</dt>
                                <dd className="mt-1 text-sm text-slate-700 whitespace-pre-wrap line-clamp-6">{trip.description_clean}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

            </div>
        </PageContainer>
    )
}
