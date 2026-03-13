import { describe, it, expect } from 'vitest'
import { extractTripDetails } from './extractFromText'

/**
 * Helper: since resolveYear picks current year or next year depending
 * on whether the month is in the past, we replicate that logic in tests.
 */
function expectedYear(month: number): number {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    return month < currentMonth ? currentYear + 1 : currentYear
}

describe('extractFromText', () => {
    // ===== EMPTY / EDGE CASES =====

    it('should return empty fields for empty text', () => {
        const result = extractTripDetails('')
        expect(result.fields).toEqual({})
        expect(result.warnings).toContain('Empty text')
        expect(result.confidence).toBe(0)
    })

    it('should return empty fields for whitespace-only text', () => {
        const result = extractTripDetails('   \n\t  ')
        expect(result.fields).toEqual({})
        expect(result.warnings).toContain('Empty text')
    })

    it('should handle noisy text with no useful info', () => {
        const result = extractTripDetails('Hello world! This is some random text with nothing useful.')
        expect(result.warnings).toContain('No dates found')
        expect(result.warnings).toContain('No price found')
        expect(result.confidence).toBeLessThan(0.5)
    })

    it('should include low confidence warning when parse is weak', () => {
        const result = extractTripDetails('Some trip info but nothing parseable')
        expect(result.warnings).toContain('Low confidence parse')
    })

    // ===== DATE PARSING (NUMERIC) =====

    it('should extract simple date DD.MM', () => {
        const result = extractTripDetails('Meeting on 15.02')
        expect(result.fields.start_date).toBe(`${expectedYear(2)}-02-15`)
    })

    it('should extract simple date DD/MM', () => {
        const result = extractTripDetails('Departure 03/06')
        expect(result.fields.start_date).toBe(`${expectedYear(6)}-06-03`)
    })

    it('should extract full date range DD.MM-DD.MM', () => {
        const result = extractTripDetails('Trip dates 07.02-14.02')
        expect(result.fields.start_date).toBe(`${expectedYear(2)}-02-07`)
        expect(result.fields.end_date).toBe(`${expectedYear(2)}-02-14`)
    })

    it('should extract short range DD-DD.MM', () => {
        const result = extractTripDetails('Weekend 17-18.01 в горах')
        expect(result.fields.start_date).toBe(`${expectedYear(1)}-01-17`)
        expect(result.fields.end_date).toBe(`${expectedYear(1)}-01-18`)
    })

    it('should add confidence for dates', () => {
        const result = extractTripDetails('Trip on 15.02 price 100 pln')
        expect(result.confidence).toBeGreaterThanOrEqual(0.6) // dates + price
    })

    // ===== DATE PARSING (WORD-MONTH) =====

    it('should extract date with Russian month name (января)', () => {
        const result = extractTripDetails('Выезд 15 января')
        expect(result.fields.start_date).toBe(`${expectedYear(1)}-01-15`)
    })

    it('should extract date with Russian month name (февраля)', () => {
        const result = extractTripDetails('Встреча 22 февраля')
        expect(result.fields.start_date).toBe(`${expectedYear(2)}-02-22`)
    })

    it('should extract date range with Russian month name (17-18 марта)', () => {
        const result = extractTripDetails('Поездка 17-18 марта')
        expect(result.fields.start_date).toBe(`${expectedYear(3)}-03-17`)
        expect(result.fields.end_date).toBe(`${expectedYear(3)}-03-18`)
    })

    it('should extract date with Polish month name (marca)', () => {
        const result = extractTripDetails('Wyjazd 10 marca')
        expect(result.fields.start_date).toBe(`${expectedYear(3)}-03-10`)
    })

    it('should extract date with Polish month name (stycznia)', () => {
        const result = extractTripDetails('Spotkanie 5 stycznia')
        expect(result.fields.start_date).toBe(`${expectedYear(1)}-01-05`)
    })

    it('should extract date with English month name (february)', () => {
        const result = extractTripDetails('Trip on 14 february')
        expect(result.fields.start_date).toBe(`${expectedYear(2)}-02-14`)
    })

    it('should extract date range with English month name (march)', () => {
        const result = extractTripDetails('Dates: 5-12 march')
        expect(result.fields.start_date).toBe(`${expectedYear(3)}-03-05`)
        expect(result.fields.end_date).toBe(`${expectedYear(3)}-03-12`)
    })

    it('should extract date with short English month name (aug)', () => {
        const result = extractTripDetails('Starting 1 aug')
        expect(result.fields.start_date).toBe(`${expectedYear(8)}-08-01`)
    })

    // ===== PRICE PARSING =====

    it('should extract price in PLN (zł)', () => {
        const result = extractTripDetails('Cena: 190 zł za osobę')
        expect(result.fields.price_amount).toBe(190)
        expect(result.fields.price_currency).toBe('PLN')
    })

    it('should extract price in PLN (pln text)', () => {
        const result = extractTripDetails('Trip to Warsaw price 100 pln')
        expect(result.fields.price_amount).toBe(100)
        expect(result.fields.price_currency).toBe('PLN')
    })

    it('should extract price in EUR (€ prefix)', () => {
        const result = extractTripDetails('Only €150 per person')
        expect(result.fields.price_amount).toBe(150)
        expect(result.fields.price_currency).toBe('EUR')
    })

    it('should extract price in EUR (eur text)', () => {
        const result = extractTripDetails('Price is 200 eur')
        expect(result.fields.price_amount).toBe(200)
        expect(result.fields.price_currency).toBe('EUR')
    })

    it('should extract price in USD ($ prefix)', () => {
        const result = extractTripDetails('Cost: $99 for the weekend')
        expect(result.fields.price_amount).toBe(99)
        expect(result.fields.price_currency).toBe('USD')
    })

    it('should detect split cost keywords (fuel/paliwo)', () => {
        const result = extractTripDetails('Na paliwo się zrzucimy razem')
        expect(result.fields.price_text).toBe('Sharing costs')
    })

    it('should detect split cost keywords (PL/zrzutka)', () => {
        const result = extractTripDetails('Na paliwo zrzutka')
        expect(result.fields.price_text).toBe('Sharing costs')
    })

    it('should detect split cost keywords (EN)', () => {
        const result = extractTripDetails('We split all expenses equally')
        expect(result.fields.price_text).toBe('Sharing costs')
    })

    // ===== SEATS PARSING =====

    it('should extract seats count (PL: miejsca)', () => {
        const result = extractTripDetails('Zostało 3 miejsca wolne')
        expect(result.fields.seats_total).toBe(3)
        expect(result.fields.seats_left).toBe(3)
    })

    it('should extract seats count (EN: spots)', () => {
        const result = extractTripDetails('Last 2 spots available!')
        expect(result.fields.seats_total).toBe(2)
        expect(result.fields.seats_left).toBe(2)
    })

    it('should extract seats count (PL: wolne)', () => {
        const result = extractTripDetails('2 wolne')
        expect(result.fields.seats_total).toBe(2)
    })

    // ===== LOCATION PARSING =====

    it('should extract "from" city (PL: z)', () => {
        const result = extractTripDetails('Wyjeżdżamy z Warszawy do Zakopanego')
        expect(result.fields.from_city).toBeTruthy()
    })

    it('should extract "to" destination (PL: do)', () => {
        const result = extractTripDetails('Jedziemy do Zakopanego na weekend')
        expect(result.fields.to_place).toBeTruthy()
    })

    it('should capitalize extracted locations', () => {
        const result = extractTripDetails('Trip from: london to: paris')
        if (result.fields.from_city) {
            expect(result.fields.from_city[0]).toBe(result.fields.from_city[0].toUpperCase())
        }
        if (result.fields.to_place) {
            expect(result.fields.to_place[0]).toBe(result.fields.to_place[0].toUpperCase())
        }
    })

    // ===== TITLE GENERATION =====

    it('should generate title from to_place', () => {
        const result = extractTripDetails('Trip to: alps, 15.02, 150 eur, 4 spots')
        expect(result.fields.title).toContain('to')
    })

    it('should generate "New Trip" when no location found', () => {
        const result = extractTripDetails('Fun weekend 15.02 200 pln')
        // No from/to extracted:
        if (!result.fields.from_city && !result.fields.to_place) {
            expect(result.fields.title).toBe('New Trip')
        }
    })

    it('should warn when title cannot be descriptive', () => {
        const result = extractTripDetails('15.02 200 pln') // no from/to
        if (result.fields.title === 'New Trip') {
            expect(result.warnings).toContain('Could not generate descriptive title')
        }
    })

    // ===== COMBINED SCENARIO =====

    it('should parse a realistic Polish trip post', () => {
        const post = `
            🏔 Wypad w Tatry!
            Termin: 17-18.01
            Cena: 190 zł (paliwo + nocleg)
            Zostały 4 miejsca
            Wyjeżdżamy z Krakowa
        `
        const result = extractTripDetails(post)

        expect(result.fields.start_date).toBe(`${expectedYear(1)}-01-17`)
        expect(result.fields.end_date).toBe(`${expectedYear(1)}-01-18`)
        expect(result.fields.price_amount).toBe(190)
        expect(result.fields.price_currency).toBe('PLN')
        expect(result.fields.seats_total).toBe(4)
        expect(result.confidence).toBeGreaterThanOrEqual(0.5)
    })

    it('should parse a realistic EUR trip post with full date range', () => {
        const post = `
            Ski trip to Alps! 🎿
            07.02-14.02
            Price: €350 per person
            3 spots left
        `
        const result = extractTripDetails(post)

        expect(result.fields.start_date).toBe(`${expectedYear(2)}-02-07`)
        expect(result.fields.end_date).toBe(`${expectedYear(2)}-02-14`)
        expect(result.fields.price_amount).toBe(350)
        expect(result.fields.price_currency).toBe('EUR')
        expect(result.fields.seats_total).toBe(3)
    })

    it('should parse a combined Russian post with word-month', () => {
        const post = `
            Горы! Выезд 15 марта
            Цена: 200 eur
            3 места
            Из Варшавы
        `
        const result = extractTripDetails(post)
        expect(result.fields.start_date).toBe(`${expectedYear(3)}-03-15`)
        expect(result.fields.price_amount).toBe(200)
        expect(result.fields.price_currency).toBe('EUR')
        expect(result.fields.seats_total).toBe(3)
    })

    it('should cap confidence at 1.0', () => {
        // post with dates + price + seats + from + to = 0.3+0.3+0.1+0.1+0.1 = 0.9
        const post = 'Trip from: berlin to: prague 15.02 200 eur 5 spots'
        const result = extractTripDetails(post)
        expect(result.confidence).toBeLessThanOrEqual(1.0)
    })

    // ===== description_clean =====

    it('should set description_clean to original text', () => {
        const text = 'Original trip description text'
        const result = extractTripDetails(text)
        expect(result.fields.description_clean).toBe(text)
    })
})
