import { describe, it, expect, vi, beforeEach } from 'vitest'

// The TELEGRAM_URL_REGEX is not exported, so we replicate it for direct regex testing
// and test the full handler via mocking
const TELEGRAM_URL_REGEX = /^https:\/\/(t\.me|telegram\.me)\/[a-zA-Z0-9_]+\/\d+$/

// ===== REGEX UNIT TESTS =====
describe('TELEGRAM_URL_REGEX', () => {
    // Valid URLs
    it.each([
        'https://t.me/channel/123',
        'https://t.me/my_channel/1',
        'https://t.me/Channel123/999999',
        'https://telegram.me/channel/456',
        'https://telegram.me/my_channel/789',
    ])('should match valid URL: %s', (url) => {
        expect(TELEGRAM_URL_REGEX.test(url)).toBe(true)
    })

    // Invalid URLs
    it.each([
        ['http://t.me/channel/123', 'no https'],
        ['https://t.me/channel', 'missing message ID'],
        ['https://t.me/channel/', 'trailing slash, no ID'],
        ['https://t.me//123', 'missing channel name'],
        ['https://t.me/channel/abc', 'non-numeric message ID'],
        ['https://t.me/channel/123/extra', 'extra path segments'],
        ['https://example.com/channel/123', 'wrong domain'],
        ['https://t.me/channel/123?q=1', 'query params'],
        ['https://t.me/channel/123#anchor', 'hash fragment'],
        ['', 'empty string'],
        ['https://t.me/', 'root path only'],
        ['ftp://t.me/channel/123', 'wrong protocol'],
        ['https://t.me/chan nel/123', 'space in channel'],
    ])('should reject invalid URL: %s (%s)', (url) => {
        expect(TELEGRAM_URL_REGEX.test(url)).toBe(false)
    })
})

// ===== ROUTE HANDLER TESTS =====

// Mock Supabase
const mockGetUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
        auth: {
            getUser: mockGetUser,
        },
    })),
}))

// Mock next/cache (revalidatePath)
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// We need to dynamically import the handler AFTER mocks are set up
let POST: (request: Request) => Promise<Response>

beforeEach(async () => {
    vi.resetAllMocks()
    // Default: authenticated user
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    // Re-import to pick up fresh mocks
    const mod = await import('./route')
    POST = mod.POST
})

describe('POST /api/import/telegram', () => {
    it('should return 401 for unauthenticated users', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })

        const request = new Request('http://localhost/api/import/telegram', {
            method: 'POST',
            body: JSON.stringify({ url: 'https://t.me/channel/123' }),
        })

        const response = await POST(request)
        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.error).toContain('Unauthorized')
    })

    it('should return 400 for missing URL', async () => {
        const request = new Request('http://localhost/api/import/telegram', {
            method: 'POST',
            body: JSON.stringify({}),
        })

        const response = await POST(request)
        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('Invalid URL')
    })

    it('should return 400 for invalid Telegram URL', async () => {
        const request = new Request('http://localhost/api/import/telegram', {
            method: 'POST',
            body: JSON.stringify({ url: 'https://example.com/not-telegram' }),
        })

        const response = await POST(request)
        expect(response.status).toBe(400)
    })

    it('should return 400 for t.me URL without message ID', async () => {
        const request = new Request('http://localhost/api/import/telegram', {
            method: 'POST',
            body: JSON.stringify({ url: 'https://t.me/channel' }),
        })

        const response = await POST(request)
        expect(response.status).toBe(400)
    })

    it('should fetch and parse Telegram page with OG tags', async () => {
        const mockHtml = `
            <html>
            <head>
                <meta property="og:description" content="Trip to Alps! 15-18 January, 200 EUR">
                <meta property="og:image" content="https://cdn.telegram.org/image.jpg">
            </head>
            <body></body>
            </html>
        `

        const originalFetch = globalThis.fetch
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        })

        const request = new Request('http://localhost/api/import/telegram', {
            method: 'POST',
            body: JSON.stringify({ url: 'https://t.me/testchannel/456' }),
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.text).toContain('Trip to Alps')
        expect(body.image).toBe('https://cdn.telegram.org/image.jpg')

        globalThis.fetch = originalFetch
    })

    it('should fallback to widget text when OG description is empty', async () => {
        const mockHtml = `
            <html>
            <head></head>
            <body>
                <div class="tgme_widget_message_text">
                    Ski weekend in Tatry! 3 places left, 190 zł
                </div>
            </body>
            </html>
        `

        const originalFetch = globalThis.fetch
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        })

        const request = new Request('http://localhost/api/import/telegram', {
            method: 'POST',
            body: JSON.stringify({ url: 'https://t.me/channel/789' }),
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.text).toContain('Ski weekend')

        globalThis.fetch = originalFetch
    })

    it('should extract image from widget photo wrap style', async () => {
        const mockHtml = `
            <html>
            <head></head>
            <body>
                <div class="tgme_widget_message_text">Trip description here</div>
                <div class="tgme_widget_message_photo_wrap" style="background-image:url('https://cdn.telegram.org/bg.jpg')"></div>
            </body>
            </html>
        `

        const originalFetch = globalThis.fetch
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        })

        const request = new Request('http://localhost/api/import/telegram', {
            method: 'POST',
            body: JSON.stringify({ url: 'https://t.me/channel/100' }),
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.image).toBe('https://cdn.telegram.org/bg.jpg')

        globalThis.fetch = originalFetch
    })

    it('should return 422 when no text found', async () => {
        const mockHtml = '<html><head></head><body><p>No telegram content</p></body></html>'

        const originalFetch = globalThis.fetch
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        })

        const request = new Request('http://localhost/api/import/telegram', {
            method: 'POST',
            body: JSON.stringify({ url: 'https://t.me/channel/111' }),
        })

        const response = await POST(request)
        expect(response.status).toBe(422)
        const body = await response.json()
        expect(body.error).toContain('Could not find message text')

        globalThis.fetch = originalFetch
    })

    it('should return 502 when fetch returns non-OK', async () => {
        const originalFetch = globalThis.fetch
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
        })

        const request = new Request('http://localhost/api/import/telegram', {
            method: 'POST',
            body: JSON.stringify({ url: 'https://t.me/channel/999' }),
        })

        const response = await POST(request)
        expect(response.status).toBe(502)

        globalThis.fetch = originalFetch
    })
})
