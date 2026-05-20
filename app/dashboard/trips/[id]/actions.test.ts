import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateApplicationStatus, closeTrip } from './actions'

// ===== Mock Supabase =====
const mockGetUser = vi.fn()
const mockRpc = vi.fn()
const mockUpdate = vi.fn()

// Separate chains for trips.select().eq().single()
const mockTripSingle = vi.fn()
const mockTripEq = vi.fn(() => ({ single: mockTripSingle }))
const mockTripSelect = vi.fn(() => ({ eq: mockTripEq }))

// For update().eq()
const mockUpdateEq = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() =>
        Promise.resolve({
            auth: { getUser: mockGetUser },
            from: vi.fn((table: string) => {
                if (table === 'trips') {
                    return {
                        select: mockTripSelect,
                        update: mockUpdate.mockReturnValue({ eq: mockUpdateEq }),
                    }
                }
                return {}
            }),
            rpc: mockRpc,
        })
    ),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('updateApplicationStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default: trip exists, user is owner
        mockTripSingle.mockResolvedValue({
            data: { owner_id: 'user-1' },
            error: null,
        })
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-1' } },
        })
        mockRpc.mockResolvedValue({
            data: { success: true, message: 'Status updated.' },
            error: null,
        })
    })

    it('should return error if trip not found', async () => {
        mockTripSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

        const result = await updateApplicationStatus('trip-1', 'app-1', 'approved', 1)
        expect(result.error).toBe('Trip not found.')
    })

    it('should return error if user is not the owner', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'other-user' } },
        })

        const result = await updateApplicationStatus('trip-1', 'app-1', 'approved', 1)
        expect(result.error).toBe('Unauthorized.')
    })

    it('should return error if user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })

        const result = await updateApplicationStatus('trip-1', 'app-1', 'approved', 1)
        expect(result.error).toBe('Unauthorized.')
    })

    it('should call RPC with correct parameters', async () => {
        await updateApplicationStatus('trip-1', 'app-1', 'approved', 2)

        expect(mockRpc).toHaveBeenCalledWith('manage_application_status', {
            p_trip_id: 'trip-1',
            p_app_id: 'app-1',
            p_new_status: 'approved',
        })
    })

    it('should return success message from RPC', async () => {
        const result = await updateApplicationStatus('trip-1', 'app-1', 'approved', 1)
        expect(result.message).toBe('Status updated.')
        expect(result.error).toBeUndefined()
    })

    it('should return error on RPC failure', async () => {
        mockRpc.mockResolvedValue({
            data: null,
            error: { message: 'RPC failed' },
        })

        const result = await updateApplicationStatus('trip-1', 'app-1', 'approved', 1)
        expect(result.error).toBe('Database error.')
    })

    it('should return error when RPC returns success=false', async () => {
        mockRpc.mockResolvedValue({
            data: { success: false, message: 'Not enough seats' },
            error: null,
        })

        const result = await updateApplicationStatus('trip-1', 'app-1', 'approved', 1)
        expect(result.error).toBe('Not enough seats')
    })

    it('should handle different application statuses', async () => {
        for (const status of ['approved', 'waitlist', 'rejected'] as const) {
            vi.clearAllMocks()
            mockTripSingle.mockResolvedValue({ data: { owner_id: 'user-1' }, error: null })
            mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
            mockRpc.mockResolvedValue({ data: { success: true, message: 'OK' }, error: null })

            await updateApplicationStatus('trip-1', 'app-1', status, 1)
            expect(mockRpc).toHaveBeenCalledWith('manage_application_status', {
                p_trip_id: 'trip-1',
                p_app_id: 'app-1',
                p_new_status: status,
            })
        }
    })
})

describe('closeTrip', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockTripSingle.mockResolvedValue({
            data: { owner_id: 'user-1', slug: 'test-trip-abc1' },
            error: null,
        })
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-1' } },
        })
        mockUpdateEq.mockResolvedValue({ error: null })
    })

    it('should return error if trip not found', async () => {
        mockTripSingle.mockResolvedValue({ data: null, error: null })

        const result = await closeTrip('trip-1')
        expect(result).toEqual({ error: 'Unauthorized' })
    })

    it('should return error if user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })

        const result = await closeTrip('trip-1')
        expect(result).toEqual({ error: 'Unauthorized' })
    })

    it('should return error if user is not the owner', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'other-user' } },
        })

        const result = await closeTrip('trip-1')
        expect(result).toEqual({ error: 'Unauthorized' })
    })

    it('should update trip status to closed', async () => {
        const result = await closeTrip('trip-1')
        expect(result).toEqual({ success: true })
        expect(mockUpdate).toHaveBeenCalledWith({ status: 'closed' })
    })

    it('should return error if update fails', async () => {
        mockUpdateEq.mockResolvedValue({ error: { message: 'DB error' } })

        const result = await closeTrip('trip-1')
        expect(result).toEqual({ error: 'Failed to close trip' })
    })
})
