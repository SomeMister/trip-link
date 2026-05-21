import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitApplication, type ApplicationState } from './actions'

// ===== Mock Supabase =====
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()

const mockFrom = vi.fn((table: string) => {
    if (table === 'trips') {
        return {
            select: mockSelect.mockReturnValue({
                eq: mockEq.mockReturnValue({
                    single: mockSingle,
                }),
            }),
        }
    }
    if (table === 'applications') {
        return { insert: mockInsert }
    }
    return {}
})

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() =>
        Promise.resolve({
            from: mockFrom,
        })
    ),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// ===== Helpers =====
function makeFormData(overrides: Record<string, string> = {}): FormData {
    const defaults: Record<string, string> = {
        trip_id: 'trip-123',
        name: 'John Doe',
        contact_type: 'telegram',
        contact_value: '@johndoe',
        seats_requested: '1',
        note: 'Looking forward!',
    }
    const data = { ...defaults, ...overrides }
    const fd = new FormData()
    for (const [k, v] of Object.entries(data)) {
        fd.set(k, v)
    }
    return fd
}

const emptyPrevState: ApplicationState = { message: null }

describe('submitApplication', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default: trip exists, is published, has seats
        mockSingle.mockResolvedValue({
            data: { status: 'published', seats_left: 10, slug: 'test-trip-abc1' },
            error: null,
        })
        mockInsert.mockResolvedValue({ error: null })
    })

    // ===== VALIDATION =====

    describe('validation', () => {
        it('should reject empty name', async () => {
            const result = await submitApplication(emptyPrevState, makeFormData({ name: '' }))
            expect(result.errors?.name).toBeTruthy()
            expect(result.message).toContain('fix the errors')
        })

        it('should reject name shorter than 2 chars', async () => {
            const result = await submitApplication(emptyPrevState, makeFormData({ name: 'A' }))
            expect(result.errors?.name).toBeTruthy()
        })

        it('should accept name with 2+ chars', async () => {
            const result = await submitApplication(emptyPrevState, makeFormData({ name: 'Al' }))
            expect(result.errors?.name).toBeUndefined()
        })

        it('should reject empty contact', async () => {
            const result = await submitApplication(emptyPrevState, makeFormData({ contact_value: '' }))
            expect(result.errors?.contact).toBeTruthy()
        })

        it('should reject contact shorter than 3 chars', async () => {
            const result = await submitApplication(emptyPrevState, makeFormData({ contact_value: 'ab' }))
            expect(result.errors?.contact).toBeTruthy()
        })

        it('should reject seats less than 1', async () => {
            const result = await submitApplication(emptyPrevState, makeFormData({ seats_requested: '0' }))
            expect(result.errors?.seats_requested).toBeTruthy()
        })

        it('should reject invalid phone characters', async () => {
            const result = await submitApplication(
                emptyPrevState,
                makeFormData({ contact_type: 'phone', contact_value: 'abc123' })
            )
            expect(result.errors?.contact).toBeTruthy()
            expect(result.errors!.contact![0]).toContain('invalid characters')
        })

        it('should accept valid phone numbers', async () => {
            const result = await submitApplication(
                emptyPrevState,
                makeFormData({ contact_type: 'phone', contact_value: '+48 123 456 789' })
            )
            expect(result.errors?.contact).toBeUndefined()
        })

        it('should accept phone with parentheses and dashes', async () => {
            const result = await submitApplication(
                emptyPrevState,
                makeFormData({ contact_type: 'phone', contact_value: '+1 (555) 123-4567' })
            )
            expect(result.errors?.contact).toBeUndefined()
        })

        it('should return multiple validation errors at once', async () => {
            const result = await submitApplication(
                emptyPrevState,
                makeFormData({ name: '', contact_value: '', seats_requested: '0' })
            )
            expect(result.errors?.name).toBeTruthy()
            expect(result.errors?.contact).toBeTruthy()
            expect(result.errors?.seats_requested).toBeTruthy()
        })
    })

    // ===== CONTACT SANITIZATION =====

    describe('contact sanitization', () => {
        it('should strip @ from telegram handle', async () => {
            await submitApplication(emptyPrevState, makeFormData({
                contact_type: 'telegram',
                contact_value: '@johndoe',
            }))
            // Check the insert was called with stripped handle
            const insertCall = mockInsert.mock.calls[0]?.[0]
            expect(insertCall?.contact_telegram).toBe('johndoe')
        })

        it('should strip @ from instagram handle', async () => {
            await submitApplication(emptyPrevState, makeFormData({
                contact_type: 'instagram',
                contact_value: '@jane_doe',
            }))
            const insertCall = mockInsert.mock.calls[0]?.[0]
            expect(insertCall?.contact_instagram).toBe('jane_doe')
        })

        it('should not strip @ from phone', async () => {
            // Phone wouldn't normally start with @, but testing the logic
            await submitApplication(emptyPrevState, makeFormData({
                contact_type: 'phone',
                contact_value: '123456789',
            }))
            const insertCall = mockInsert.mock.calls[0]?.[0]
            expect(insertCall?.contact_phone).toBe('123456789')
        })

        it('should keep telegram handle without @ as-is', async () => {
            await submitApplication(emptyPrevState, makeFormData({
                contact_type: 'telegram',
                contact_value: 'johndoe',
            }))
            const insertCall = mockInsert.mock.calls[0]?.[0]
            expect(insertCall?.contact_telegram).toBe('johndoe')
        })
    })

    // ===== TRIP STATUS CHECKS =====

    describe('trip status checks', () => {
        it('should reject if trip not found', async () => {
            mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

            const result = await submitApplication(emptyPrevState, makeFormData())
            expect(result.message).toBe('Trip not found.')
        })

        it('should reject if trip is draft', async () => {
            mockSingle.mockResolvedValue({
                data: { status: 'draft', seats_left: 5, slug: 'test' },
                error: null,
            })

            const result = await submitApplication(emptyPrevState, makeFormData())
            expect(result.message).toContain('not currently accepting')
        })

        it('should reject if trip is closed', async () => {
            mockSingle.mockResolvedValue({
                data: { status: 'closed', seats_left: 5, slug: 'test' },
                error: null,
            })

            const result = await submitApplication(emptyPrevState, makeFormData())
            expect(result.message).toContain('not currently accepting')
        })

        it('should reject if not enough seats', async () => {
            mockSingle.mockResolvedValue({
                data: { status: 'published', seats_left: 1, slug: 'test' },
                error: null,
            })

            const result = await submitApplication(
                emptyPrevState,
                makeFormData({ seats_requested: '3' })
            )
            expect(result.message).toContain('Not enough seats')
        })

        it('should allow when seats_left is null (unlimited)', async () => {
            mockSingle.mockResolvedValue({
                data: { status: 'published', seats_left: null, slug: 'test' },
                error: null,
            })

            const result = await submitApplication(emptyPrevState, makeFormData({ seats_requested: '100' }))
            expect(result.success).toBe(true)
        })
    })

    // ===== SUCCESS PATH =====

    describe('success path', () => {
        it('should return success on valid submission', async () => {
            const result = await submitApplication(emptyPrevState, makeFormData())
            expect(result.success).toBe(true)
            expect(result.message).toContain('successfully')
        })

        it('should insert with correct trip_id and status=new', async () => {
            await submitApplication(emptyPrevState, makeFormData({ trip_id: 'trip-xyz' }))
            const insertCall = mockInsert.mock.calls[0]?.[0]
            expect(insertCall?.trip_id).toBe('trip-xyz')
            expect(insertCall?.status).toBe('new')
        })

        it('should default seats_requested to 1 when not provided', async () => {
            const fd = makeFormData()
            fd.delete('seats_requested')
            await submitApplication(emptyPrevState, fd)
            const insertCall = mockInsert.mock.calls[0]?.[0]
            expect(insertCall?.seats_requested).toBe(1)
        })
    })

    // ===== ERROR HANDLING =====

    describe('error handling', () => {
        it('should handle insert error', async () => {
            mockInsert.mockResolvedValue({ error: { message: 'DB error' } })

            const result = await submitApplication(emptyPrevState, makeFormData())
            expect(result.message).toContain('Failed to submit')
        })
    })
})
