'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ApplicationState = {
    message: string | null
    errors?: {
        name?: string[]
        contact?: string[]
        seats_requested?: string[]
    }
}

export async function submitApplication(prevState: ApplicationState, formData: FormData): Promise<ApplicationState> {
    const supabase = await createClient()

    const tripId = formData.get('trip_id') as string
    const name = formData.get('name') as string
    const contactType = formData.get('contact_type') as string
    const contactValue = formData.get('contact_value') as string
    const seatsRequested = Number(formData.get('seats_requested') || 1)
    const note = formData.get('note') as string

    // 1. Validation
    const errors: ApplicationState['errors'] = {}
    if (!name || name.length < 2) errors.name = ['Name must be at least 2 characters.']

    if (!contactValue || contactValue.length < 3) {
        errors.contact = ['Please provide a valid username or number.']
    }

    if (seatsRequested < 1) errors.seats_requested = ['At least 1 seat is required.']

    // Basic format validation
    if (contactType === 'phone') {
        // Allow +, spaces, digits. Heuristic check.
        if (!/^[\d\s+()-]+$/.test(contactValue)) {
            errors.contact = ['Phone number contains invalid characters.']
        }
    }

    if (Object.keys(errors).length > 0) {
        return { message: 'Please fix the errors below.', errors }
    }

    // Sanitize handles
    let sanitizedContact = contactValue
    if ((contactType === 'telegram' || contactType === 'instagram') && sanitizedContact.startsWith('@')) {
        sanitizedContact = sanitizedContact.substring(1)
    }

    try {
        // 2. Check Trip Status & Capacity
        const { data: trip, error: tripError } = await supabase
            .from('trips')
            .select('status, seats_left, slug')
            .eq('id', tripId)
            .single()

        if (tripError || !trip) {
            return { message: 'Trip not found.' }
        }

        if (trip.status !== 'published') {
            return { message: 'This trip is not currently accepting applications.' }
        }

        if (trip.seats_left !== null && trip.seats_left < seatsRequested) {
            return { message: 'Not enough seats available.' }
        }

        // 3. Insert Application
        // Determine target column
        const insertPayload: any = {
            trip_id: tripId,
            name,
            seats_requested: seatsRequested,
            note,
            status: 'new'
        }

        if (contactType === 'telegram') insertPayload.contact_telegram = sanitizedContact
        else if (contactType === 'instagram') insertPayload.contact_instagram = sanitizedContact
        else if (contactType === 'phone') insertPayload.contact_phone = sanitizedContact

        const { error: insertError } = await supabase
            .from('applications')
            .insert(insertPayload)

        if (insertError) {
            console.error('Insert Error:', insertError)
            return { message: 'Failed to submit application. Please try again.' }
        }

        // Success
        revalidatePath(`/t/${trip.slug}`)
        return { message: 'Application sent successfully!' }

    } catch (error) {
        console.error('Submit Error:', error)
        return { message: 'Internal server error.' }
    }
}
