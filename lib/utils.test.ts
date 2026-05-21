import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, getStorageUrl } from './utils'

describe('cn', () => {
    it('should merge simple class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes via clsx', () => {
        expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
    })

    it('should merge conflicting tailwind classes (last wins)', () => {
        // twMerge resolves conflicts: p-4 + p-2 → p-2
        expect(cn('p-4', 'p-2')).toBe('p-2')
    })

    it('should merge tailwind color conflicts', () => {
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('should handle object syntax from clsx', () => {
        expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500')
    })

    it('should handle array syntax', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle empty input', () => {
        expect(cn()).toBe('')
    })

    it('should handle undefined and null', () => {
        expect(cn(undefined, null, 'valid')).toBe('valid')
    })

    it('should merge complex tailwind classes', () => {
        expect(cn('rounded-lg bg-white p-4', 'p-6 bg-gray-100')).toBe('rounded-lg p-6 bg-gray-100')
    })
})

describe('getStorageUrl', () => {
    const ORIGINAL_ENV = process.env

    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV }
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co'
    })

    afterEach(() => {
        process.env = ORIGINAL_ENV
    })

    it('should return null for null path', () => {
        expect(getStorageUrl(null)).toBeNull()
    })

    it('should return null for undefined path', () => {
        expect(getStorageUrl(undefined)).toBeNull()
    })

    it('should return null for empty string', () => {
        expect(getStorageUrl('')).toBeNull()
    })

    it('should return full URL for relative path', () => {
        const result = getStorageUrl('trip-123/photo.jpg')
        expect(result).toBe('https://abc.supabase.co/storage/v1/object/public/trip-photos/trip-123/photo.jpg')
    })

    it('should return the URL as-is if it already starts with http', () => {
        const url = 'https://example.com/image.jpg'
        expect(getStorageUrl(url)).toBe(url)
    })

    it('should return the URL as-is for http (non-https)', () => {
        const url = 'http://example.com/image.jpg'
        expect(getStorageUrl(url)).toBe(url)
    })

    it('should handle path with special characters', () => {
        const result = getStorageUrl('trip-123/my photo (1).jpg')
        expect(result).toBe('https://abc.supabase.co/storage/v1/object/public/trip-photos/trip-123/my photo (1).jpg')
    })
})
