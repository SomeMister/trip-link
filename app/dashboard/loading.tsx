export default function DashboardLoading() {
    return (
        <div className="space-y-10 pb-12 animate-pulse">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-8 w-48 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-64 bg-slate-100 rounded mt-2" />
                </div>
                <div className="h-12 w-44 bg-slate-200 rounded-2xl" />
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl mb-4" />
                        <div className="h-6 w-12 bg-slate-200 rounded mb-2" />
                        <div className="h-3 w-20 bg-slate-100 rounded" />
                    </div>
                ))}
            </div>

            {/* Trip cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="h-40 bg-slate-100" />
                        <div className="p-5 space-y-3">
                            <div className="h-5 w-3/4 bg-slate-200 rounded" />
                            <div className="h-4 w-1/2 bg-slate-100 rounded" />
                            <div className="h-4 w-2/3 bg-slate-100 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
