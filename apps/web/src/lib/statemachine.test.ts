import { describe, it, expect, vi } from 'vitest'
import { isValidTransition, transition, InvalidTransitionError, type StateMachineConfig } from './statemachine'

describe('statemachine', () => {
  const config: StateMachineConfig = {
    entity: 'order',
    transitions: [
      { from: 'pending', to: 'paid' },
      { from: 'paid', to: 'shipped' },
      { from: '*', to: 'cancelled' }
    ]
  }

  it('validates transitions', () => {
    expect(isValidTransition(config, 'pending', 'paid')).toBe(true)
    expect(isValidTransition(config, 'pending', 'shipped')).toBe(false)
    expect(isValidTransition(config, 'shipped', 'cancelled')).toBe(true)
    expect(isValidTransition(config, 'pending', 'cancelled')).toBe(true)
  })

  it('transition succeeds and writes audit log', async () => {
    const mockDb = {
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) })
    }
    const auditLogTable = {}
    
    await transition(mockDb as any, auditLogTable, config, '123', 'pending', 'paid', 'user1')
    expect(mockDb.insert).toHaveBeenCalledWith(auditLogTable)
  })

  it('invalid transition throws', async () => {
    const mockDb = {
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) })
    }
    const auditLogTable = {}

    await expect(
      transition(mockDb as any, auditLogTable, config, '123', 'pending', 'shipped', 'user1')
    ).rejects.toThrow(InvalidTransitionError)
    
    expect(mockDb.insert).not.toHaveBeenCalled()
  })
})
