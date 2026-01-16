export type TripStatus = 'draft' | 'published' | 'closed';
export type ApplicationStatus = 'new' | 'approved' | 'waitlist' | 'rejected';

export interface Trip {
    id: string;
    owner_id: string;
    slug: string;
    title: string;
    description_raw: string;
    description_clean?: string;
    start_date?: string | null; // stored as date string (YYYY-MM-DD)
    end_date?: string | null;
    from_city?: string | null;
    to_place?: string | null;
    price_amount?: number | null;
    price_currency?: string | null;
    price_text?: string | null;
    seats_total?: number | null;
    seats_left?: number | null;
    cover_image_url?: string | null;
    status: TripStatus;
    created_at: string;
}

export interface Application {
    id: string;
    trip_id: string;
    name: string;
    contact_phone?: string | null;
    contact_instagram?: string | null;
    contact_telegram?: string | null;
    seats_requested: number;
    note?: string | null;
    status: ApplicationStatus;
    created_at: string;
}

export interface ParsedTripFields {
    title?: string;
    start_date?: string; // YYYY-MM-DD
    end_date?: string;   // YYYY-MM-DD
    from_city?: string;
    to_place?: string;
    price_amount?: number;
    price_currency?: string;
    price_text?: string;
    seats_total?: number;
    seats_left?: number;
    description_clean?: string;
}

export interface ParseResult {
    fields: ParsedTripFields;
    confidence: number;
    warnings: string[];
}
