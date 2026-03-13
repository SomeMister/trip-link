export default function TripPageLoading() {
    return (
        <div className="min-h-screen bg-gray-50 animate-pulse">
            {/* Hero image skeleton */}
            <div className="max-w-5xl mx-auto lg:pt-8 lg:px-8">
                <div className="h-72 md:h-[450px] bg-slate-200 lg:rounded-3xl" />
            </div>

            <main className="max-w-5xl mx-auto px-4 py-8 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column skeleton */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-10 w-3/4 bg-slate-200 rounded-lg" />
                        <div className="flex gap-3">
                            <div className="h-10 w-32 bg-slate-100 rounded-xl" />
                            <div className="h-10 w-28 bg-slate-100 rounded-xl" />
                            <div className="h-10 w-36 bg-slate-100 rounded-xl" />
                        </div>
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-3">
                            <div className="h-6 w-32 bg-slate-200 rounded" />
                            <div className="h-4 w-full bg-slate-100 rounded" />
                            <div className="h-4 w-full bg-slate-100 rounded" />
                            <div className="h-4 w-2/3 bg-slate-100 rounded" />
                        </div>
                    </div>

                    {/* Right column skeleton */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-4">
                        <div className="h-6 w-32 bg-slate-200 rounded" />
                        <div className="h-10 w-full bg-slate-100 rounded-lg" />
                        <div className="h-10 w-full bg-slate-100 rounded-lg" />
                        <div className="h-10 w-full bg-slate-100 rounded-lg" />
                        <div className="h-12 w-full bg-slate-200 rounded-lg" />
                    </div>
                </div>
            </main>
        </div>
    )
}
