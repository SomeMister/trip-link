import { describe, it, expect } from 'vitest'
import { extractTripDetails } from './extractFromText'

describe('extractFromText', () => {
    it('should return empty fields for empty text', () => {
        const result = extractTripDetails('')
        expect(result.fields).toEqual({})
        expect(result.warnings).toContain('Empty text')
    })

    it('should extract price in PLN', () => {
        const result = extractTripDetails('Trip to Warsaw price 100 pln')
        expect(result.fields.price_amount).toBe(100)
        expect(result.fields.price_currency).toBe('PLN')
    })

    it('should extract simple date', () => {
        // We mock the current year in the implementation implicitly, so let's check basic format
        const year = new Date().getFullYear();
        const result = extractTripDetails('Meeting on 15.02')
        expect(result.fields.start_date).toBe(`${year}-02-15`)
    })
})
