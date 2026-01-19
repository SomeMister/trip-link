'use client'

import Link from 'next/link'
import { MapPin, Calendar, Users } from 'lucide-react'

interface TripCardProps {
    trip: any
}

export function TripCard({ trip }: TripCardProps) {
    // Считаем новые заявки для бейджа
    const newAppsCount = trip.applications?.filter((app: any) => app.status === 'new').length || 0

    // Расчет заполненности
    const totalSeats = trip.seats_total || 0
    const seatsLeft = trip.seats_left || 0
    const occupiedSeats = totalSeats - seatsLeft
    const occupancyRate = totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0

    // Функция для формирования URL (аналогично Carousel.tsx)
    const getImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trip-photos/${path}`;
    };

    // Логика выбора обложки: сначала cover_image_url, если его нет — берем первое фото из trip_images
    const firstImagePath = trip.trip_images?.sort((a: any, b: any) => a.position - b.position)[0]?.storage_path;
    const finalImageUrl = getImageUrl(trip.cover_image_url || firstImagePath);

    return (
        <Link
            href={`/dashboard/trips/${trip.id}`}
            className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-100 transition-all duration-300 overflow-hidden flex flex-col"
        >
            {/* Фото поездки */}
            <div className="relative h-40 w-full bg-slate-100">
                {finalImageUrl ? (
                    <img
                        src={finalImageUrl}
                        alt={trip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase">
                        Нет обложки
                    </div>
                )}

                {/* Статус и счетчик новых заявок */}
                <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${trip.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                        }`}>
                        {trip.status}
                    </span>
                    {newAppsCount > 0 && (
                        <span className="bg-rose-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold animate-pulse shadow-sm">
                            +{newAppsCount} НОВЫХ
                        </span>
                    )}
                </div>
            </div>

            {/* Инфо о поездке */}
            <div className="p-5 flex-grow flex flex-col text-left">
                <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-teal-600 transition-colors">
                    {trip.title}
                </h3>

                <div className="space-y-2 mb-4 text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="line-clamp-1">{trip.to_place || 'Локация не указана'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{trip.start_date || 'Дата TBD'}</span>
                    </div>
                </div>

                {/* Прогресс-бар */}
                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <Users className="h-3.5 w-3.5" />
                            <span>{occupiedSeats} / {totalSeats} занято</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{Math.round(occupancyRate)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${occupancyRate >= 100 ? 'bg-rose-500' : 'bg-teal-500'
                                }`}
                            style={{ width: `${occupancyRate}%` }}
                        />
                    </div>
                </div>
            </div>
        </Link>
    )
}