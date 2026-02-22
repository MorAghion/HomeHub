/** Auth fixtures — User and Household shapes used in tests */
export interface MockUser {
  id: string
  email: string
  user_metadata: {
    full_name?: string
  }
}

export interface MockHousehold {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'mock-user-id',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
    },
    ...overrides,
  }
}

export function createMockHousehold(overrides: Partial<MockHousehold> = {}): MockHousehold {
  return {
    id: 'mock-household-id',
    name: 'Test Household',
    owner_id: 'mock-user-id',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}
