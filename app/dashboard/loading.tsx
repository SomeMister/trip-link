export default function DashboardLoading() {
    return (
        <div className="space-y-10 pb-12">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-8 w-48 animate-shimmer rounded-lg" />
                    <div className="h-4 w-64 animate-shimmer rounded mt-2 animate-duration-1000" />
                </div>
                <div className="h-12 w-44 animate-shimmer rounded-2xl" />
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 animate-shimmer rounded-xl mb-4" />
                        <div className="h-6 w-12 animate-shimmer rounded mb-2" />
                        <div className="h-3 w-20 animate-shimmer rounded" />
                    </div>
                ))}
            </div>

            {/* Trip cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="h-40 animate-shimmer" />
                        <div className="p-5 space-y-3 flex-grow">
                            <div className="h-5 w-3/4 animate-shimmer rounded" />
                            <div className="h-4 w-1/2 animate-shimmer rounded" />
                            <div className="h-4 w-2/3 animate-shimmer rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
