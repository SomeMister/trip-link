'use client'

import { useState, useRef } from 'react'
import { X, Image as ImageIcon, UploadCloud } from 'lucide-react'

interface ImageUploadProps {
    name?: string
    maxFiles?: number
    className?: string
}

export function ImageUpload({ name = 'photos', maxFiles = 5, className = '' }: ImageUploadProps) {
    const [previews, setPreviews] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dataTransferRef = useRef<DataTransfer | null>(null)

    const getDataTransfer = () => {
        if (!dataTransferRef.current) {
            dataTransferRef.current = new DataTransfer()
        }
        return dataTransferRef.current
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = e.target.files
        if (!newFiles) return

        const dt = getDataTransfer()
        const availableSlots = maxFiles - dt.items.length

        const newFileUrls: string[] = []

        Array.from(newFiles).slice(0, availableSlots).forEach(file => {
            dt.items.add(file)
            newFileUrls.push(URL.createObjectURL(file))
        })

        if (fileInputRef.current) {
            fileInputRef.current.files = dt.files
        }

        setPreviews(prev => [...prev, ...newFileUrls])
    }

    const removeImage = (index: number) => {
        const dt = getDataTransfer()
        const newDt = new DataTransfer()
        const files = dt.files

        for (let i = 0; i < files.length; i++) {
            if (i !== index) {
                newDt.items.add(files[i])
            }
        }

        dataTransferRef.current = newDt
        if (fileInputRef.current) {
            fileInputRef.current.files = newDt.files
        }
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div className={className}>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Trip Photos</label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {previews.map((src, index) => (
                    <div key={index} className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); removeImage(index); }}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {previews.length < maxFiles && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all text-slate-400 hover:text-indigo-600"
                    >
                        <UploadCloud size={24} className="mb-1" />
                        <span className="text-xs font-medium">Add Photo</span>
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                name={name}
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
            <p className="text-xs text-slate-500">
                Select up to {maxFiles} photos. First photo will be the cover.
            </p>
        </div>
    )
}
