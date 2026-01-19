'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface CarouselProps {
    images: {
        storage_path: string
        public_url?: string
    }[]
    className?: string
}

export function Carousel({ images, className = '' }: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    if (!images || images.length === 0) return null

    const getUrl = (path: string) => {
        if (path.startsWith('http')) return path
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trip-photos/${path}`
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }

    return (
        <div className={`relative w-full h-72 md:h-[450px] bg-slate-100 overflow-hidden group ${className}`}>
            <div className="w-full h-full relative">
                <img
                    src={getUrl(images[currentIndex].storage_path)}
                    alt={`Slide ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-500"
                />
            </div>

            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute top-1/2 -translate-y-1/2 left-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
                        {images.map((_, index) => (
                            <div
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`transition-all h-1.5 rounded-full cursor-pointer ${currentIndex === index ? 'bg-white w-6' : 'bg-white/50 w-1.5'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}