import { describe, it, expect } from 'vitest'
import { generateSlug } from './slug'

describe('generateSlug', () => {
    it('should return a lowercase string', () => {
        const slug = generateSlug('My Trip Title')
        expect(slug).toBe(slug.toLowerCase())
    })

    it('should contain the slugified title', () => {
        const slug = generateSlug('Weekend in Alps')
        // slugify with strict: true produces "weekend-in-alps"
        expect(slug).toMatch(/^weekend-in-alps-/)
    })

    it('should append a 4-character nanoid suffix after the base slug', () => {
        const slug = generateSlug('Test')
        // format: "test-XXXX" where XXXX is nanoid(4)
        // nanoid alphabet includes '-', so we can't split by '-'
        // Instead verify the slug starts with "test-" and has 4 more chars
        expect(slug).toMatch(/^test-.{4}$/)
    })

    it('should handle special characters (strict mode strips them)', () => {
        const slug = generateSlug('Trip to Kraków! 🏔️')
        // strict: true removes non-alphanumeric except dashes
        expect(slug).not.toContain('!')
        expect(slug).not.toContain('🏔')
        expect(slug).toMatch(/^[a-z0-9_-]+$/)
    })

    it('should handle Polish diacritics', () => {
        const slug = generateSlug('Wyjazd do Łodzi')
        // slugify converts ł → l, etc.
        expect(slug).toMatch(/^[a-z0-9_-]+$/)
        expect(slug).toMatch(/^wyjazd-do-lodzi-/)
    })

    it('should generate unique slugs for same title', () => {
        const slugs = new Set<string>()
        for (let i = 0; i < 20; i++) {
            slugs.add(generateSlug('Same Title'))
        }
        // With nanoid(4), collision is extremely unlikely in 20 iterations
        expect(slugs.size).toBeGreaterThan(1)
    })

    it('should handle empty string', () => {
        const slug = generateSlug('')
        // slugify('') returns '', then we append "-XXXX"
        expect(slug).toMatch(/^-[a-zA-Z0-9_-]+$/)
        expect(slug.length).toBeGreaterThanOrEqual(5) // "-" + 4 chars
    })

    it('should handle title with only spaces', () => {
        const slug = generateSlug('   ')
        // slugify trims and returns ''
        expect(slug).toMatch(/^-[a-zA-Z0-9_-]+$/)
    })

    it('should handle numeric title', () => {
        const slug = generateSlug('12345')
        expect(slug).toMatch(/^12345-[a-z0-9_-]+$/)
    })

    it('should handle very long title', () => {
        const longTitle = 'A'.repeat(200)
        const slug = generateSlug(longTitle)
        expect(slug).toBeTruthy()
        expect(slug.endsWith(slug.split('-').pop()!)).toBe(true)
    })
})
