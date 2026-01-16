import { ParseResult, ParsedTripFields } from './types';

export function extractTripDetails(text: string): ParseResult {
    const fields: ParsedTripFields = {};
    const warnings: string[] = [];
    let confidence = 0.0;

    if (!text || text.trim().length === 0) {
        return { fields, confidence: 0, warnings: ['Empty text'] };
    }

    // Normalize text for easier parsing (keep original for description)
    const normalized = text.toLowerCase();
    fields.description_clean = text; // By default same as input

    // 1. Dates
    // Regex for DD.MM or DD/MM or DD-DD.MM
    // Simplistic approach: find patterns like \d{1,2}[./-]\d{1,2}
    // Try to find ranges first: 10-15.02
    const dateRangeRegex = /(\d{1,2})[.-](\d{1,2})[./-](\d{2,4}|\d{2})/;
    // Single date: 15.02
    const simpleDateRegex = /(\d{1,2})[./-](\d{1,2})/;

    const dateMatch = normalized.match(dateRangeRegex) || normalized.match(simpleDateRegex);

    if (dateMatch) {
        // This is a very basic parser, assumes current year if missing or parses simple DD.MM
        // TODO: Improve year handling and multiple date formats
        // detailed implementation would need a library like date-fns or compromise
        // For MVP, we extract the string and try to format YYYY-MM-DD
        try {
            // if range, dateMatch[2] might be second day or month depending on regex
            // Let's refine the regex logic for dates to be more specific

            // Strategy: Look for specific patterns

            // Pattern: 07.02-14.02 (Full range)
            const fullRange = normalized.match(/(\d{1,2})[./-](\d{1,2})\s*-\s*(\d{1,2})[./-](\d{1,2})/);

            // Pattern: 17-18.01 (Short range)
            const shortRange = normalized.match(/(\d{1,2})\s*-\s*(\d{1,2})[./-](\d{1,2})/);

            const currentYear = new Date().getFullYear();

            if (fullRange) {
                fields.start_date = `${currentYear}-${fullRange[2].padStart(2, '0')}-${fullRange[1].padStart(2, '0')}`;
                fields.end_date = `${currentYear}-${fullRange[4].padStart(2, '0')}-${fullRange[3].padStart(2, '0')}`;
            } else if (shortRange) {
                fields.start_date = `${currentYear}-${shortRange[3].padStart(2, '0')}-${shortRange[1].padStart(2, '0')}`;
                fields.end_date = `${currentYear}-${shortRange[3].padStart(2, '0')}-${shortRange[2].padStart(2, '0')}`;
            } else {
                // Single date
                const single = normalized.match(/(\d{1,2})[./-](\d{1,2})/);
                if (single) {
                    fields.start_date = `${currentYear}-${single[2].padStart(2, '0')}-${single[1].padStart(2, '0')}`;
                }
            }

            if (fields.start_date) confidence += 0.3;
        } catch {
            warnings.push('Could not parse specific dates');
        }
    } else {
        warnings.push('No dates found');
    }

    // 2. Price
    // 190 zł, 190pln, 150 eur, $150
    const priceRegex = /(\d+)\s*(zl|zł|pln|eur|euro|\$)|(\$|€)\s*(\d+)/i;
    const priceMatch = normalized.match(priceRegex);

    if (priceMatch) {
        if (priceMatch[1]) {
            fields.price_amount = parseInt(priceMatch[1], 10);
            fields.price_currency = priceMatch[2].toUpperCase().replace('ZL', 'PLN').replace('ZŁ', 'PLN').replace('EURO', 'EUR');
        } else if (priceMatch[4]) {
            fields.price_amount = parseInt(priceMatch[4], 10);
            fields.price_currency = priceMatch[3] === '$' ? 'USD' : 'EUR'; // minimal assumption
        }
        confidence += 0.3;
    } else {
        // Check for 'split cost' keywords
        if (normalized.includes('delim') || normalized.includes('split') || normalized.includes('zrzutka') || normalized.includes('paliwo')) {
            fields.price_text = 'Sharing costs';
            confidence += 0.2;
        } else {
            warnings.push('No price found');
        }
    }

    // 3. Seats
    // 2 miejsca, 2 places, 2 spots, wolne 2
    const seatsRegex = /(\d+)\s*(miejsca|miejsc|places|spots|wolne)/i;
    const seatsMatch = normalized.match(seatsRegex);
    if (seatsMatch) {
        fields.seats_total = parseInt(seatsMatch[1], 10);
        fields.seats_left = fields.seats_total; // assume all left initially
        confidence += 0.1;
    }

    // 4. Locations (From/To)
    // Simplistic keyword lookups
    const fromKeywords = ['z miasta', 'start:', 'from:', 'wyjazd z', 'z '];
    const toKeywords = ['do miasta', 'do ', 'to:', 'kierunek '];

    // This is hard to regex reliably without NLP, so we do a best effort scan
    // We look for capitalized words after these prepositions in the original text (not normalized) primarily?
    // Or just Grab next word.

    // Helper to extract word after phrase
    const extractAfter = (phrases: string[], searchIn: string): string | undefined => {
        for (const p of phrases) {
            const idx = searchIn.indexOf(p);
            if (idx !== -1) {
                // grab next 15 chars or until end of line/comma
                const substr = searchIn.substring(idx + p.length).trim();
                const match = substr.match(/^([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/);
                if (match) return match[1];
            }
        }
        return undefined;
    };

    fields.from_city = extractAfter(fromKeywords, normalized); // normalized search for keywords
    // Capitalize result?
    if (fields.from_city) {
        fields.from_city = fields.from_city.charAt(0).toUpperCase() + fields.from_city.slice(1);
        confidence += 0.1;
    }

    fields.to_place = extractAfter(toKeywords, normalized);
    if (fields.to_place) {
        fields.to_place = fields.to_place.charAt(0).toUpperCase() + fields.to_place.slice(1);
        confidence += 0.1;
    }

    // Title generation
    if (fields.to_place || fields.from_city) {
        fields.title = `Trip ${fields.from_city ? 'from ' + fields.from_city : ''} ${fields.to_place ? 'to ' + fields.to_place : ''}`;
    } else {
        fields.title = 'New Trip';
        warnings.push('Could not generate descriptive title');
    }

    if (confidence < 0.5) {
        warnings.push('Low confidence parse');
    }

    return { fields, confidence: Math.min(confidence, 1.0), warnings };
}
