export type Role = 'admin' | 'sales' | 'sales_manager' | 'coordinator' | 'technician' | 'accounting' | 'warehouse' | 'customer'
export type Action = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'assign' | 'export'
export type Resource = 'customer' | 'lead' | 'site_visit' | 'appointment' | 'work_log' | 'check_out' | 'payment' | 'credit' | 'quotation' | 'delivery' | 'user' | 'report' | 'product' | 'price_list'

type Permission = `${Action}:${Resource}`

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'create:customer', 'read:customer', 'update:customer', 'delete:customer',
    'create:lead', 'read:lead', 'update:lead', 'delete:lead',
    'create:site_visit', 'read:site_visit', 'update:site_visit', 'delete:site_visit', 'approve:site_visit',
    'create:appointment', 'read:appointment', 'update:appointment', 'delete:appointment', 'assign:appointment',
    'create:work_log', 'read:work_log', 'update:work_log', 'delete:work_log',
    'create:check_out', 'read:check_out', 'update:check_out', 'delete:check_out',
    'create:payment', 'read:payment', 'update:payment', 'delete:payment', 'approve:payment',
    'create:credit', 'read:credit', 'update:credit', 'delete:credit', 'approve:credit',
    'create:quotation', 'read:quotation', 'update:quotation', 'delete:quotation', 'approve:quotation',
    'create:delivery', 'read:delivery', 'update:delivery', 'delete:delivery',
    'create:user', 'read:user', 'update:user', 'delete:user',
    'create:report', 'read:report', 'update:report', 'delete:report', 'export:report',
    'create:product', 'read:product', 'update:product', 'delete:product',
    'create:price_list', 'read:price_list', 'update:price_list', 'delete:price_list'
  ],
  sales: [
    'create:customer', 'read:customer', 'update:customer',
    'create:lead', 'read:lead', 'update:lead',
    'create:site_visit', 'read:site_visit', 'update:site_visit',
    'create:quotation', 'read:quotation', 'update:quotation',
    'read:product', 'read:price_list'
  ],
  sales_manager: [
    'create:customer', 'read:customer', 'update:customer',
    'create:lead', 'read:lead', 'update:lead',
    'create:site_visit', 'read:site_visit', 'update:site_visit', 'approve:site_visit',
    'create:quotation', 'read:quotation', 'update:quotation', 'approve:quotation',
    'approve:credit',
    'read:product', 'read:price_list'
  ],
  coordinator: [
    'create:appointment', 'read:appointment', 'update:appointment', 'assign:appointment',
    'read:customer', 'read:site_visit'
  ],
  technician: [
    'read:appointment', 'read:site_visit',
    'create:work_log', 'update:work_log',
    'create:check_out', 'update:check_out'
  ],
  accounting: [
    'read:customer', 'read:lead', 'read:site_visit', 'read:appointment', 'read:work_log', 'read:check_out', 'read:payment', 'read:credit', 'read:quotation', 'read:delivery', 'read:user', 'read:report', 'read:product', 'read:price_list',
    'create:payment', 'update:payment', 'approve:payment',
    'export:report'
  ],
  warehouse: [
    'read:delivery', 'read:product',
    'create:delivery', 'update:delivery'
  ],
  customer: [
    'read:quotation'
  ]
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

export function can(roles: Role[], action: Action, resource: Resource): boolean {
  const reqPerm = `${action}:${resource}` as Permission
  for (const role of roles) {
    if (getPermissions(role).includes(reqPerm)) return true
  }
  return false
}

export function canAny(roles: Role[], resource: Resource): boolean {
  for (const role of roles) {
    const perms = getPermissions(role)
    if (perms.some(p => p.endsWith(`:${resource}`))) return true
  }
  return false
}
