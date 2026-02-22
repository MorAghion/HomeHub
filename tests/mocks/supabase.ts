import { vi } from 'vitest'

/**
 * Mock Supabase client for unit/component tests.
 * Replaces real network calls with controllable vi.fn() stubs.
 *
 * Usage:
 *   vi.mock('@/supabaseClient', () => ({ supabase: createMockSupabaseClient() }))
 *
 * Override specific methods per test:
 *   mockSupabase.from.mockReturnValueOnce(...)
 */
export function createMockSupabaseClient() {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  }

  const mockAuth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  }

  const mockStorage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'mock/path' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://mock.supabase.co/mock/path' } }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }

  return {
    from: vi.fn().mockReturnValue(mockQuery),
    auth: mockAuth,
    storage: mockStorage,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    _mockQuery: mockQuery,
  }
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>
