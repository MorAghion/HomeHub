import { describe, it, expect } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'
import { createMockLocalStorage } from '../mocks/localStorage'

describe('Mock utilities smoke test', () => {
  it('createMockSupabaseClient has expected shape', () => {
    const client = createMockSupabaseClient()
    expect(typeof client.from).toBe('function')
    expect(typeof client.auth.getSession).toBe('function')
    expect(typeof client.storage.from).toBe('function')
    expect(typeof client.rpc).toBe('function')
  })

  it('mockSupabase.from() returns chainable query builder', () => {
    const client = createMockSupabaseClient()
    const query = client.from('vouchers')
    expect(query).toBeDefined()
    expect(typeof query.select).toBe('function')
    expect(typeof query.insert).toBe('function')
    expect(typeof query.eq).toBe('function')
  })

  it('createMockLocalStorage stores and retrieves values', () => {
    const storage = createMockLocalStorage()
    storage.setItem('key', 'value')
    expect(storage.getItem('key')).toBe('value')
    storage.removeItem('key')
    expect(storage.getItem('key')).toBeNull()
  })

  it('createMockLocalStorage.clear() empties the store', () => {
    const storage = createMockLocalStorage()
    storage.setItem('a', '1')
    storage.setItem('b', '2')
    storage.clear()
    expect(storage.length).toBe(0)
  })
})
