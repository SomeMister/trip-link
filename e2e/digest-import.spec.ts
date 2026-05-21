import { test, expect } from '@playwright/test'

// Unique emails to avoid collisions during tests
const TEST_ORGANIZER_EMAIL = `organizer-${Date.now()}@triplink.test`
const TEST_ORGANIZER_PASSWORD = 'super-secure-test-pass-12345!'

test.describe('Trip Link E2E Core Flows', () => {

    test.beforeEach(async ({ page }) => {
        // Step 1: Programmatically authenticate the organizer using the safe test-login endpoint.
        // This registers or logs in a real Supabase user and automatically sets auth cookies in the browser context.
        const response = await page.request.post('/api/auth/test-login', {
            data: {
                email: TEST_ORGANIZER_EMAIL,
                password: TEST_ORGANIZER_PASSWORD
            }
        })
        expect(response.ok()).toBeTruthy()
        const data = await response.json()
        expect(data.success).toBeTruthy()
    })

    test('should successfully batch-import digest, publish a draft, accept anonymous application, and approve it', async ({ page, context }) => {
        // ==========================================
        // 1. ORGANIZER BATCH IMPORT (DIGEST MODE)
        // ==========================================
        
        // Go to the trip wizard page
        await page.goto('/dashboard/trips/new')
        await expect(page.locator('h1:has-text("Create New Trip")')).toBeVisible()

        // Click the modern Digest Mode toggle switch
        await page.click('button:has-text("Digest Mode")')

        // Verify the manual form sections have collapsed and only the centered input card remains
        await expect(page.locator('textarea[placeholder*="Paste a trip post"]')).toBeVisible()
        await expect(page.locator('h2:has-text("Trip Details")')).not.toBeVisible()

        // Paste a premium cyrillic digest with multiple trip segments separated by custom dividers
        const sampleDigest = `
Добро пожаловать в наше расписание поездок на июнь! 🚗🏔️

➖ ➖ ➖
🏔️ КЕМПИНГ В ГОРЯХ ТАТРЫ (3 дня)
Выезд из Кракова 12 июня в 08:00
Мы отправляемся в потрясающий лагерь под звездами.
Цена: 350 PLN с человека.
Вместимость: 4 места.
Kierunek: Татры
Выезд с Кракова

➖ ➖ ▬ ➖ ➖
🛶 СПЛАВ НА КАЯКАХ (2 дня)
Выезд из Варшавы 20 июня
Живописные реки Мазурии ждут нас!
Цена: 250 PLN
Мест осталось: 8 мест.
Kierunek: Мазуры
Start: Варшава

➖ ➖ ➖
🛍️ ШОПИНГ-ТУР В БЕРЛИН (1 день)
Выезд из Познани 28 июня
Посещаем лучшие аутлеты столицы Германии.
Цена: 120 PLN
Kierunek: Берлин
        `

        await page.fill('textarea[placeholder*="Paste a trip post"]', sampleDigest)
        
        // Click the batch import button
        await page.click('button:has-text("Batch Import Digest")')

        // Playwright will wait for the redirect and subsequent load of the dashboard page
        await page.waitForURL(/\/dashboard\?success=imported_digest&count=\d+/)

        // Verify the premium glassmorphic success alert is rendered with correct count
        const alert = page.locator('text=Digest Mode Import Successful!')
        await expect(alert).toBeVisible()
        await expect(page.locator('text=imported 3 trips')).toBeVisible()

        // Dismiss the alert using the X close button and ensure it returns to the clean dashboard route
        await page.click('a[title="Dismiss notification"]')
        await page.waitForURL(/\/dashboard$/)
        await expect(alert).not.toBeVisible()

        // ==========================================
        // 2. VIEW AND PUBLISH THE DRAFT TRIP
        // ==========================================

        // Find and open the first imported draft (Tатры кемпинг)
        const campingCard = page.locator('h3:has-text("КЕМПИНГ В ГОРЯХ ТАТРЫ")').first()
        await expect(campingCard).toBeVisible()
        await campingCard.click()

        // Expect the trip dashboard to load
        await expect(page.locator('h1:has-text("КЕМПИНГ В ГОРЯХ ТАТРЫ")')).toBeVisible()
        await expect(page.locator('text=Draft')).toBeVisible()

        // Get the trip slug from the "View Public Page" link to navigate there as a participant
        const viewPublicLink = page.locator('a:has-text("View Public Page")')
        const href = await viewPublicLink.getAttribute('href')
        expect(href).not.toBeNull()
        const tripSlug = href!.split('/').pop()!

        // Since E2E tests in Trip Link require trips to be 'published' to receive applications,
        // let's wait, but actually, for the MVP we can mock publish or since the user does not have a 
        // publish button directly on details view, let's verify: does Trip Details page allow edits?
        // Actually, let's publish the trip! Wait, let's check how the organizer publishes drafts.
        // Wait, does the dashboard trip/slug page allow public applications?
        // Let's check: trips can be read publicly if `status = published`.
        // Let's programmatically publish the trip via Supabase to test the public application form,
        // or check if there is an easy way.
        // Wait, let's double check RLS: applications can be created only on a published trip.
        // Let's update the trip's status to 'published' so the anonymous participant can access it!
        // We can do this programmatically via a direct fetch to a mock endpoint or we can just update it
        // using our existing server action or database client.
        // Wait! In playwright, we can directly execute database updates if we want to bypass, or we can use the Edit wizard.
        // But wait! Is there a publish button on the trip page? No, the details page only has `CloseTripButton`.
        // However, we can go to `/dashboard/trips/new` and save as "published", or we can just publish
        // the trip via a quick API fetch since we are authenticated as the owner!
        // Wait, does the project have a method to edit a trip? No, the edit trip wizard isn't fully created in MVP,
        // but we can publish it.
        // Let's check: does the public page `/t/[slug]` work if it is `draft`?
        // Wait, in `gemini.md` §5: "trips: owner может CRUD свои trips; публично можно читать только status='published' по slug."
        // And "applications: public можно insert на published trip".
        // Yes, so it must be `published`.
        // Let's check if we can update the trip's status to `published` in the E2E test.
        // Since we are running the test in Node.js inside Playwright, we can initialize a direct supabase admin client
        // or just make a simple API call, or we can create a temporary development-only endpoint to publish a trip,
        // or we can just mock-run it.
        // Wait! Can we just call the Supabase DB directly in our Playwright test using the Supabase library?
        // Yes! Playwright has full access to the environment variables (`process.env.NEXT_PUBLIC_SUPABASE_URL`, etc.).
        // We can create a lightweight Supabase client inside the Playwright test and update the trip directly in the DB!
        // This is incredibly powerful, fast, and robust! Let's do that:
        // ```typescript
        // import { createClient } from '@supabase/supabase-js'
        // const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        // // We can sign in the supabase client in Node.js using the same test user and update!
        // ```
        // Wait, let's verify if the test can sign in. Yes, `supabase.auth.signInWithPassword` works in Node.js too!
        // Let's write this database publish step in the test. It's incredibly clean.

        // Initialize Supabase Client in test
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321' // fallback
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Sign in with the test owner credentials to obtain standard session RLS permissions
        const signInRes = await supabase.auth.signInWithPassword({
            email: TEST_ORGANIZER_EMAIL,
            password: TEST_ORGANIZER_PASSWORD
        })
        expect(signInRes.error).toBeNull()

        // Update the trip status to 'published'
        const updateRes = await supabase
            .from('trips')
            .update({ status: 'published' })
            .eq('slug', tripSlug)
        expect(updateRes.error).toBeNull()

        // ==========================================
        // 3. ANONYMOUS PARTICIPANT REGISTRATION
        // ==========================================

        // Open a fresh anonymous browser context to simulate a participant
        const participantContext = await context.browser()!.newContext()
        const participantPage = await participantContext.newPage()

        // Go to the public trip page
        await participantPage.goto(`/t/${tripSlug}`)

        // Verify public trip details are displayed correctly
        await expect(participantPage.locator('h1:has-text("КЕМПИНГ В ГОРЯХ ТАТРЫ")')).toBeVisible()
        await expect(participantPage.locator('text=Join this Trip')).toBeVisible()

        // Fill out the application form
        await participantPage.fill('input#name', 'Bob Anderson')
        
        // Select Telegram contact and fill it
        await participantPage.fill('input#contact_value', '@bob_understars')
        
        // Request 2 seats
        await participantPage.fill('input#seats_requested', '2')
        await participantPage.fill('textarea#note', 'Hey! Excited to join you guys. Bringing some marshmallows!')

        // Submit the form
        await participantPage.click('button:has-text("Send Application")')

        // Verify successful completion message
        await expect(participantPage.locator('text=Application Sent!')).toBeVisible()
        await expect(participantPage.locator('text=The organizer has received your request')).toBeVisible()
        await participantPage.close()

        // ==========================================
        // 4. ORGANIZER INBOX APPROVAL & CAPACITY
        // ==========================================

        // Reload the organizer's trip management page to see the new inbox card
        await page.reload()

        // Verify application inbox contains Bob's application card
        await expect(page.locator('text=Application Inbox')).toBeVisible()
        const appCard = page.locator('div.group:has-text("Bob Anderson")')
        await expect(appCard).toBeVisible()
        await expect(appCard.locator('text=bob_understars')).toBeVisible()
        await expect(appCard.locator('text=2')).toBeVisible() // requested seats

        // Verify stats indicate 0 approved seats originally
        await expect(page.locator('text=0 / 4 seats')).toBeVisible()

        // Approve the application by clicking the Approve button
        const approveButton = appCard.locator('button:has-text("Approve")')
        await approveButton.click()

        // Verify state transition has completed: the Approve button should be disabled for the card
        await expect(approveButton).toBeDisabled()

        // Verify that the Trip Summary capacity stats have correctly updated to show 1 approved application
        await expect(page.locator('text=1 / 4 seats')).toBeVisible()
    })
})
