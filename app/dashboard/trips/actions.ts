'use server'

import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/slug'
import { redirect } from 'next/navigation'
import { TripStatus } from '@/lib/types'

export type CreateTripState = {
    message?: string | null
    errors?: Record<string, string[]>
}

export async function createTrip(prevState: CreateTripState, formData: FormData) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { message: 'Unauthorized' }
    }

    // 2. Extract Data
    const title = formData.get('title') as string
    const description_raw = formData.get('description_raw') as string
    const description_clean = formData.get('description_clean') as string
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string
    const from_city = formData.get('from_city') as string
    const to_place = formData.get('to_place') as string
    const price_amount = formData.get('price_amount')
    const price_currency = formData.get('price_currency') as string // default PLN
    const seats_total = formData.get('seats_total')
    // const seats_left = seats_total // Initially full capacity available
    const status = formData.get('status') as TripStatus

    // 3. Validation (Minimal)
    if (!title) {
        return { errors: { title: ['Title is required'] } }
    }

    // 4. Slug Generation
    // Always generate slug, even for drafts, to ensure uniqueness constraints are met early
    // OR generate only on publish? Schema says it's NOT NULL. So must generate now.
    let slug = generateSlug(title)

    // Collision check loop (simple retry)
    let unique = false
    let attempts = 0
    while (!unique && attempts < 3) {
        const { data } = await supabase.from('trips').select('id').ilike('slug', slug).single()
        if (!data) {
            unique = true
        } else {
            slug = generateSlug(title) // try again with new random suffix
            attempts++
        }
    }

    if (!unique) {
        return { message: 'Failed to generate unique link. Please try again.' }
    }

    // 5. Insert Trip
    const { data, error } = await supabase.from('trips').insert({
        owner_id: user.id,
        slug,
        title,
        description_raw,
        description_clean,
        start_date: start_date || null,
        end_date: end_date || null,
        from_city,
        to_place,
        price_amount: price_amount ? Number(price_amount) : null,
        price_currency: price_currency || 'PLN',
        seats_total: seats_total ? Number(seats_total) : null,
        seats_left: seats_total ? Number(seats_total) : null,
        status: status || 'draft',
        cover_image_url: null, // We will calculate this from images if needed, or leave null for now
    }).select('id').single()

    if (error) {
        return { message: error.message }
    }

    const tripId = data.id

    // 6. Handle Photos
    const photos = formData.getAll('photos') as File[]
    if (photos && photos.length > 0) {
        const uploads = []
        let position = 0

        for (const file of photos) {
            // Skip if not a file or empty (sometimes empty inputs send neutral data)
            if (!(file instanceof File) || file.size === 0) continue

            const fileExt = file.name.split('.').pop()
            const fileName = `${tripId}/${crypto.randomUUID()}.${fileExt}`

            // Upload to Supabase Storage
            const uploadPromise = supabase.storage
                .from('trip-photos')
                .upload(fileName, file)
                .then(async ({ data: uploadData, error: uploadError }) => {
                    if (uploadError) {
                        console.error('Upload error:', uploadError)
                        return null
                    }
                    // Insert into DB
                    return supabase.from('trip_images').insert({
                        trip_id: tripId,
                        storage_path: fileName,
                        position: position++
                    })
                })

            uploads.push(uploadPromise)
        }

        await Promise.all(uploads)

        // Update cover image URL if we successfully uploaded images (MVP: take the first one)
        // We can skip this if we handle cover in the carousel logic mostly
        // But let's try to set it for the card view in dashboard
        // We won't do a full secondary update just yet to keep it fast, or we can?
        // Let's rely on the trip_images table for the public page mostly.
        // If the Main Dashboard needs a cover, we might query trip_images there too or update here.
        // For simplicity: Update cover_image_url with the first successful upload path public URL?
        // Actually, let's keep it simple. The schema has cover_image_url. 
        // We can do a quick update if we have at least one photo.
        // (Skipping for now to avoid complexity, Carousel works on trip_images)
    }

    // 7. Redirect
    redirect(`/dashboard/trips/${tripId}`)
}
