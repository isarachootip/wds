import { describe, it, expect, vi } from 'vitest'
import { emit, processEvents, MAX_ATTEMPTS } from './events'

describe('Domain Events & Transactional Outbox', () => {
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

  it('processEvents executes handler, marks event processed on success', async () => {
    const mockEvents = [
      {
        id: 'evt-1',
        name: 'OrderCreated',
        aggregate: 'Order',
        aggregateId: '123',
        payload: { amount: 100 },
        attempts: 0,
        status: 'pending',
      }
    ]

    const setMock = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    })
    const updateMock = vi.fn().mockReturnValue({ set: setMock })

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockEvents)
        })
      }),
      update: updateMock,
    }

    const table = {
      id: 'id',
      status: 'status',
      attempts: 'attempts',
    }

    const handler = vi.fn().mockResolvedValue(undefined)
    const handlers = {
      'OrderCreated': handler
    }

    const res = await processEvents(mockDb as any, table, handlers)

    expect(handler).toHaveBeenCalledWith(mockEvents[0])
    expect(res.processed).toBe(1)
    expect(res.failed).toBe(0)
    expect(updateMock).toHaveBeenCalled()
    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'processed',
    }))
  })

  it('processEvents increments attempts and records error on handler failure', async () => {
    const mockEvents = [
      {
        id: 'evt-2',
        name: 'PaymentFailed',
        aggregate: 'Payment',
        aggregateId: '456',
        payload: {},
        attempts: 1,
        status: 'pending',
      }
    ]

    const setMock = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    })
    const updateMock = vi.fn().mockReturnValue({ set: setMock })

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockEvents)
        })
      }),
      update: updateMock,
    }

    const table = {
      id: 'id',
      status: 'status',
      attempts: 'attempts',
    }

    const failingHandler = vi.fn().mockRejectedValue(new Error('Gateway timeout'))
    const handlers = {
      'PaymentFailed': failingHandler
    }

    const res = await processEvents(mockDb as any, table, handlers)

    expect(failingHandler).toHaveBeenCalled()
    expect(res.processed).toBe(0)
    expect(res.failed).toBe(1)
    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
      attempts: 2,
      lastError: 'Gateway timeout',
    }))
  })
})
