import { describe, it, expect, vi } from 'vitest'
import { emit, processEvents, MAX_ATTEMPTS } from './events'

describe('events', () => {
  it('emit inserts row with pending status and 0 attempts', async () => {
    const valuesMock = vi.fn().mockResolvedValue([])
    const mockTx = {
      insert: vi.fn().mockReturnValue({ values: valuesMock })
    }
    const table = {}

    await emit(mockTx as any, table, 'OrderCreated', 'Order', '123', { amount: 100 })
    
    expect(mockTx.insert).toHaveBeenCalledWith(table)
    expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({
      name: 'OrderCreated',
      aggregate: 'Order',
      aggregateId: '123',
      status: 'pending',
      attempts: 0
    }))
  })

  // Basic tests for processEvents logic that would be fleshed out
  it('processEvents handles events correctly', async () => {
    const db = {} as any
    const table = {} as any
    const handlers = {
      'OrderCreated': async () => {}
    }
    
    const res = await processEvents(db, table, handlers)
    expect(res).toHaveProperty('processed')
    expect(res).toHaveProperty('failed')
  })
})
