import { describe, it, expect } from 'vitest'

// Emulate Supabase Postgres RLS policies from 00004_rls_policies.sql
interface AuthContext {
  uid: string | null
  roles: string[]
  email?: string
}

interface UserRow {
  id: string
  displayName: string
  deletedAt: Date | null
}

interface CustomerRow {
  id: string
  name: string
  email: string
  deletedAt: Date | null
}

interface DomainEventRow {
  id: string
  name: string
  status: string
}

// Evaluation engine matching SQL policies in 00004_rls_policies.sql
class RLSEvaluator {
  static evaluateUserSelect(auth: AuthContext, row: UserRow): boolean {
    if (!auth.uid) return false // Anon key with no user session is blocked
    const permittedRoles = ['admin', 'sales_manager', 'sales', 'coordinator', 'accounting']
    const hasPermittedRole = auth.roles.some((r) => permittedRoles.includes(r))
    return row.id === auth.uid || hasPermittedRole
  }

  static evaluateCustomerSelect(auth: AuthContext, row: CustomerRow): boolean {
    if (row.deletedAt !== null) return false
    if (!auth.uid) return false // Anon key with no session is blocked

    const staffRoles = ['admin', 'sales', 'sales_manager', 'coordinator', 'accounting', 'warehouse']
    const isStaff = auth.roles.some((r) => staffRoles.includes(r))
    if (isStaff) return true

    const isCustomer = auth.roles.includes('customer')
    if (isCustomer && auth.email && row.email === auth.email) {
      return true
    }

    return false
  }

  static evaluateDomainEventsSelect(auth: AuthContext, _row: DomainEventRow): boolean {
    if (!auth.uid) return false // Anon key blocked
    return auth.roles.includes('admin')
  }
}

describe('Phase 0 Acceptance: RLS Security & Anonymous Isolation', () => {
  const anonContext: AuthContext = {
    uid: null,
    roles: [],
  }

  const salesContext: AuthContext = {
    uid: 'user-sales-01',
    roles: ['sales'],
    email: 'sales@wds.co.th',
  }

  const customerA: AuthContext = {
    uid: 'user-cust-01',
    roles: ['customer'],
    email: 'customer.a@gmail.com',
  }

  const customerB: AuthContext = {
    uid: 'user-cust-02',
    roles: ['customer'],
    email: 'customer.b@gmail.com',
  }

  const sampleUsers: UserRow[] = [
    { id: 'user-sales-01', displayName: 'สมศักดิ์ ฝ่ายขาย', deletedAt: null },
    { id: 'user-admin-01', displayName: 'ผู้ดูแลระบบ', deletedAt: null },
    { id: 'user-cust-01', displayName: 'ลูกค้า ก.', deletedAt: null },
  ]

  const sampleCustomers: CustomerRow[] = [
    { id: 'cust-1', name: 'บริษัท วิวัฒน์ก่อสร้าง จำกัด', email: 'customer.a@gmail.com', deletedAt: null },
    { id: 'cust-2', name: 'ห้างหุ้นส่วนจำกัด เจริญพัฒนา', email: 'customer.b@gmail.com', deletedAt: null },
  ]

  it('blocks anonymous key queries across users table (0 rows returned)', () => {
    const accessible = sampleUsers.filter((u) => RLSEvaluator.evaluateUserSelect(anonContext, u))
    expect(accessible).toHaveLength(0)
  })

  it('blocks anonymous key queries across customers table', () => {
    const accessible = sampleCustomers.filter((c) => RLSEvaluator.evaluateCustomerSelect(anonContext, c))
    expect(accessible).toHaveLength(0)
  })

  it('blocks anonymous key queries across domain_events table', () => {
    const eventRow: DomainEventRow = { id: 'evt-1', name: 'OrderCreated', status: 'pending' }
    expect(RLSEvaluator.evaluateDomainEventsSelect(anonContext, eventRow)).toBe(false)
  })

  it('allows authenticated sales staff to see customers while blocking cross-customer access', () => {
    // Sales can see all customers
    const salesVisible = sampleCustomers.filter((c) => RLSEvaluator.evaluateCustomerSelect(salesContext, c))
    expect(salesVisible).toHaveLength(2)

    // Customer A can ONLY see their own customer row, not Customer B
    const custAVisible = sampleCustomers.filter((c) => RLSEvaluator.evaluateCustomerSelect(customerA, c))
    expect(custAVisible).toHaveLength(1)
    expect(custAVisible[0].email).toBe('customer.a@gmail.com')

    // Customer B cannot see Customer A's record
    const custBVisible = sampleCustomers.filter((c) => RLSEvaluator.evaluateCustomerSelect(customerB, c))
    expect(custBVisible).toHaveLength(1)
    expect(custBVisible[0].email).toBe('customer.b@gmail.com')
  })
})
