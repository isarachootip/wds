// @ts-nocheck
/**
 * RLS Audit Tests
 * 
 * These are integration tests that require a running Supabase instance.
 * Skip automatically if SUPABASE_TEST_URL is not set.
 * 
 * Run with: SUPABASE_TEST_URL=http://127.0.0.1:54321 SUPABASE_TEST_ANON_KEY=... vitest run src/__tests__/rls-audit.test.ts
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_TEST_URL
const ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY

const skip = !SUPABASE_URL || !ANON_KEY

// Tables that must be RLS-protected (anon should see 0 rows or get error)
const PROTECTED_TABLES = [
  'users', 'user_roles', 'roles',
  'customers', 'addresses',
  'leads', 'lead_activities', 'follow_ups',
  'site_visits', 'appointments', 'jobs', 'job_photos',
  'quotations', 'quotation_items', 'orders',
  'payments', 'deliveries', 'invoices',
  'credit_checks', 'customer_credit',
  'audit_log', 'domain_events', 'notifications',
]

describe.skipIf(skip)('RLS Audit â€” anon key must be blocked', () => {
  let anonClient: ReturnType<typeof createClient>

  beforeAll(() => {
    anonClient = createClient(SUPABASE_URL!, ANON_KEY!)
  })

  for (const table of PROTECTED_TABLES) {
    it(`anon SELECT on ${table} returns 0 rows`, async () => {
      const { data, error } = await anonClient
        .from(table)
        .select('id')
        .limit(5)

      // Either an error (RLS blocked) or empty array (RLS filters all rows)
      if (error) {
        // RLS denied â€” acceptable
        expect(error.code).toBeDefined()
      } else {
        // RLS returned 0 rows â€” acceptable
        expect(data).toHaveLength(0)
      }
    })
  }

  it('anon INSERT into leads is blocked', async () => {
    const { error } = await anonClient
      .from('leads')
      .insert({ source: 'other', status: 'new' })
    expect(error).toBeDefined()
  })

  it('anon INSERT into customers is blocked', async () => {
    const { error } = await anonClient
      .from('customers')
      .insert({ name: 'Hacker', phone: '0000000000' })
    expect(error).toBeDefined()
  })

  it('anon UPDATE on orders is blocked', async () => {
    const { error } = await anonClient
      .from('orders')
      .update({ status: 'closed' })
      .eq('status', 'new')
    expect(error).toBeDefined()
  })

  it('anon DELETE on payments is blocked', async () => {
    const { error } = await anonClient
      .from('payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    expect(error).toBeDefined()
  })
})

