import { ParseResult, ParsedTripFields } from './types';

// Word-month maps for RU/PL/EN (gemini.md §9)
const MONTH_MAP: Record<string, number> = {
    // English
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    // Russian
    'январь': 1, 'января': 1, 'янв': 1,
    'февраль': 2, 'февраля': 2, 'фев': 2,
    'март': 3, 'марта': 3, 'мар': 3,
    'апрель': 4, 'апреля': 4, 'апр': 4,
    'май': 5, 'мая': 5,
    'июнь': 6, 'июня': 6, 'июн': 6,
    'июль': 7, 'июля': 7, 'июл': 7,
    'август': 8, 'августа': 8, 'авг': 8,
    'сентябрь': 9, 'сентября': 9, 'сен': 9,
    'октябрь': 10, 'октября': 10, 'окт': 10,
    'ноябрь': 11, 'ноября': 11, 'ноя': 11,
    'декабрь': 12, 'декабря': 12, 'дек': 12,
    // Polish
    'styczeń': 1, 'stycznia': 1, 'sty': 1,
    'luty': 2, 'lutego': 2, 'lut': 2,
    'marzec': 3, 'marca': 3,
    'kwiecień': 4, 'kwietnia': 4, 'kwi': 4,
    'maj': 5, 'maja': 5,
    'czerwiec': 6, 'czerwca': 6, 'cze': 6,
    'lipiec': 7, 'lipca': 7, 'lip': 7,
    'sierpień': 8, 'sierpnia': 8, 'sie': 8,
    'wrzesień': 9, 'września': 9, 'wrz': 9,
    'październik': 10, 'października': 10, 'paź': 10,
    'listopad': 11, 'listopada': 11, 'lis': 11,
    'grudzień': 12, 'grudnia': 12, 'gru': 12,
};

// Build a regex alternation from all month names (sorted longest-first to avoid partial matches)
const MONTH_NAMES_PATTERN = Object.keys(MONTH_MAP)
    .sort((a, b) => b.length - a.length)
    .join('|');

/**
 * Determine the best year for a given month.
 * If the month is in the past relative to the current date, use next year.
 */
function resolveYear(month: number): number {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentYear = now.getFullYear();
    // If the trip month is before the current month, assume next year
    return month < currentMonth ? currentYear + 1 : currentYear;
}

function formatDate(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

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

    // 1. Dates — ordered by specificity to avoid conflicts
    let datesParsed = false;

    // 1a. Word-month patterns: "15 января", "15-18 marca", "15 february"
    const wordMonthRangeRegex = new RegExp(
        `(\\d{1,2})\\s*[-–]\\s*(\\d{1,2})\\s+(?:of\\s+)?(${MONTH_NAMES_PATTERN})`,
        'i'
    );
    const wordMonthSingleRegex = new RegExp(
        `(\\d{1,2})\\s+(?:of\\s+)?(${MONTH_NAMES_PATTERN})`,
        'i'
    );

    const wordRangeMatch = normalized.match(wordMonthRangeRegex);
    const wordSingleMatch = normalized.match(wordMonthSingleRegex);

    if (wordRangeMatch) {
        const day1 = parseInt(wordRangeMatch[1], 10);
        const day2 = parseInt(wordRangeMatch[2], 10);
        const month = MONTH_MAP[wordRangeMatch[3].toLowerCase()];
        if (month && day1 >= 1 && day1 <= 31 && day2 >= 1 && day2 <= 31) {
            const year = resolveYear(month);
            fields.start_date = formatDate(year, month, day1);
            fields.end_date = formatDate(year, month, day2);
            datesParsed = true;
        }
    } else if (wordSingleMatch) {
        const day = parseInt(wordSingleMatch[1], 10);
        const month = MONTH_MAP[wordSingleMatch[2].toLowerCase()];
        if (month && day >= 1 && day <= 31) {
            const year = resolveYear(month);
            fields.start_date = formatDate(year, month, day);
            datesParsed = true;
        }
    }

    // 1b. Numeric date patterns (only if word-month didn't match)
    if (!datesParsed) {
        try {
            // Pattern: 07.02-14.02 (Full range DD.MM-DD.MM)
            const fullRange = normalized.match(/(\d{1,2})[./](\d{1,2})\s*-\s*(\d{1,2})[./](\d{1,2})/);
            // Pattern: 17-18.01 (Short range DD-DD.MM)
            const shortRange = normalized.match(/(\d{1,2})\s*-\s*(\d{1,2})[./](\d{1,2})/);
            // Single date: 15.02 or 15/02
            const singleDate = normalized.match(/(\d{1,2})[./](\d{1,2})(?!\d)/);

            if (fullRange) {
                const month1 = parseInt(fullRange[2], 10);
                const month2 = parseInt(fullRange[4], 10);
                const year1 = resolveYear(month1);
                const year2 = resolveYear(month2);
                fields.start_date = formatDate(year1, month1, parseInt(fullRange[1], 10));
                fields.end_date = formatDate(year2, month2, parseInt(fullRange[3], 10));
                datesParsed = true;
            } else if (shortRange) {
                const month = parseInt(shortRange[3], 10);
                const year = resolveYear(month);
                fields.start_date = formatDate(year, month, parseInt(shortRange[1], 10));
                fields.end_date = formatDate(year, month, parseInt(shortRange[2], 10));
                datesParsed = true;
            } else if (singleDate) {
                const month = parseInt(singleDate[2], 10);
                if (month >= 1 && month <= 12) {
                    const year = resolveYear(month);
                    fields.start_date = formatDate(year, month, parseInt(singleDate[1], 10));
                    datesParsed = true;
                }
            }
        } catch {
            warnings.push('Could not parse specific dates');
        }
    }

    if (datesParsed) {
        confidence += 0.3;
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
    const seatsRegex = /(\d+)\s*(miejsca|miejsc|places|spots|wolne|мест|места|место)/i;
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

    // Helper to extract word after phrase
    const extractAfter = (phrases: string[], searchIn: string): string | undefined => {
        for (const p of phrases) {
            const idx = searchIn.indexOf(p);
            if (idx !== -1) {
                // grab next word (Unicode-aware for PL/RU)
                const substr = searchIn.substring(idx + p.length).trim();
                const match = substr.match(/^([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻа-яА-ЯёЁ]+)/);
                if (match) return match[1];
            }
        }
        return undefined;
    };

    fields.from_city = extractAfter(fromKeywords, normalized);
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
