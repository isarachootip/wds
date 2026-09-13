export type Satang = number & { readonly __brand: unique symbol }

export function satang(n: number): Satang {
  if (!Number.isInteger(n)) {
    throw new Error('Satang must be an integer')
  }
  return n as Satang
}

export function add(a: Satang, b: Satang): Satang {
  return satang(a + b)
}

export function subtract(a: Satang, b: Satang): Satang {
  return satang(a - b)
}

export function multiply(amount: Satang, factor: number): Satang {
  return satang(Math.round(amount * factor))
}

export function vat7(amount: Satang): Satang {
  return satang(Math.round((amount * 7) / 100))
}

export function withVat7(amount: Satang): { subtotal: Satang; vat: Satang; total: Satang } {
  const vat = vat7(amount)
  return {
    subtotal: amount,
    vat,
    total: add(amount, vat)
  }
}

export function fromBaht(baht: number): Satang {
  return satang(Math.round(baht * 100))
}

export function toBaht(s: Satang): number {
  return s / 100
}

export function formatTHB(s: Satang): string {
  const baht = toBaht(s)
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(baht)
}
