'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface CarouselProps {
    images: {
        storage_path: string
        public_url?: string // Optional if we construct it here
    }[]
    className?: string
}

export function Carousel({ images, className = '' }: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    if (!images || images.length === 0) return null

    // Determine URL helper
    const getUrl = (path: string) => {
        if (path.startsWith('http')) return path
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trip-photos/${path}`
    }

    const prevSlide = () => {
        const isFirstSlide = currentIndex === 0
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1
        setCurrentIndex(newIndex)
    }

    const nextSlide = () => {
        const isLastSlide = currentIndex === images.length - 1
        const newIndex = isLastSlide ? 0 : currentIndex + 1
        setCurrentIndex(newIndex)
    }

    // Touch support (simple)
    const [touchStart, setTouchStart] = useState(0)
    const [touchEnd, setTouchEnd] = useState(0)

    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX)
    const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)
    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 75) nextSlide()
        if (touchStart - touchEnd < -75) prevSlide()
    }

    return (
        <div
            className={`relative w-full aspect-video md:aspect-[2/1] bg-slate-100 rounded-2xl overflow-hidden shadow-sm group ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Image */}
            <div className="w-full h-full relative">
                <img
                    src={getUrl(images[currentIndex].storage_path)}
                    alt={`Slide ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-500"
                />
            </div>

            {/* Left Arrow */}
            {images.length > 1 && (
                <button
                    onClick={prevSlide}
                    className="hidden group-hover:block absolute top-[50%] -translate-y-[-50%] left-4 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer hover:bg-black/40 transition-all md:block"
                >
                    <ChevronLeft size={24} />
                </button>
            )}

            {/* Right Arrow */}
            {images.length > 1 && (
                <button
                    onClick={nextSlide}
                    className="hidden group-hover:block absolute top-[50%] -translate-y-[-50%] right-4 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer hover:bg-black/40 transition-all md:block"
                >
                    <ChevronRight size={24} />
                </button>
            )}

            {/* Dots */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {images.map((_, index) => (
                        <div
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`transition-all w-2 h-2 rounded-full cursor-pointer shadow-sm ${currentIndex === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
