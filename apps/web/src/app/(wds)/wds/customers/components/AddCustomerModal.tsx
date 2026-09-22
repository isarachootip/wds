'use client'

import React, { useState } from 'react'
import {
  X,
  Building2,
  Phone,
  Mail,
  User,
  CreditCard,
  MapPin,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { createCustomerAction } from '@/modules/crm/actions'
import { bahtToSatang } from '@/lib/qt-calc'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (customer: any) => void
}

export const CUSTOMER_GROUP_OPTIONS = [
  { value: 'contractor', label: 'ผู้รับเหมาก่อสร้าง (Contractor)' },
  { value: 'developer', label: 'ผู้พัฒนาอสังหาฯ / โครงการ (Developer)' },
  { value: 'wholesaler', label: 'ร้านค้าช่วง / ขายส่ง (Wholesaler)' },
  { value: 'standard', label: 'ลูกค้าทั่วไป / เจ้าของบ้าน (Standard)' },
]

export function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [customerGroup, setCustomerGroup] = useState('contractor')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [lineId, setLineId] = useState('')
  const [creditLimitBaht, setCreditLimitBaht] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [subDistrict, setSubDistrict] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('กรุณาระบุชื่อลูกค้าหรือชื่อบริษัท')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const creditSatang = creditLimitBaht ? bahtToSatang(creditLimitBaht) : 0
      const result = await createCustomerAction({
        name: name.trim(),
        taxId: taxId.trim() || undefined,
        customerGroup,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        lineId: lineId.trim() || undefined,
        creditLimitSatang: creditSatang,
        addressLine1: addressLine1.trim() || undefined,
        province: province.trim() || undefined,
        district: district.trim() || undefined,
        subDistrict: subDistrict.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        actorId: 'current-user-id',
      })

      if (!result.success) {
        setError(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
        setIsSubmitting(false)
        return
      }

      onSuccess?.(result.customer)
      onClose()
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างลูกค้า')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-card text-foreground rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-border my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Building2 className="size-6" />
            </div>
            <div>
              <h2 id="customer-modal-title" className="text-xl font-bold text-foreground">
                เพิ่มลูกค้านิติบุคคล / คู่ค้าใหม่
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                เปิดหน้าบัญชีลูกค้าองค์กรและผู้รับเหมาในระบบ Thai Watsadu WDS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Company / Customer Name & Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                ชื่อลูกค้านิติบุคคล / ร้านค้า <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="เช่น บจก. สยามนครก่อสร้าง, หจก. ชัยเจริญ"
                className="w-full px-3.5 py-2 rounded-xl text-sm bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                กลุ่มลูกค้า (Customer Group)
              </label>
              <select
                value={customerGroup}
                onChange={e => setCustomerGroup(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-sm bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
              >
                {CUSTOMER_GROUP_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tax ID & Credit Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                <FileText className="size-3.5 text-muted-foreground" />
                <span>เลขประจำตัวผู้เสียภาษี (Tax ID 13 หลัก)</span>
              </label>
              <input
                type="text"
                maxLength={13}
                value={taxId}
                onChange={e => setTaxId(e.target.value.replace(/\D/g, ''))}
                placeholder="เช่น 0105558012345"
                className="w-full px-3.5 py-2 rounded-xl text-sm font-mono bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                <CreditCard className="size-3.5 text-muted-foreground" />
                <span>วงเงินเครดิตเริ่มต้น (บาท)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={creditLimitBaht}
                onChange={e => setCreditLimitBaht(e.target.value)}
                placeholder="เช่น 500000"
                className="w-full px-3.5 py-2 rounded-xl text-sm font-mono bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Contact Details: Phone, Email, Contact Person, LINE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                <Phone className="size-3.5 text-muted-foreground" />
                <span>เบอร์โทรศัพท์ติดต่อ</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="เช่น 02-123-4567, 081-234-5678"
                className="w-full px-3.5 py-2 rounded-xl text-sm font-mono bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                <User className="size-3.5 text-muted-foreground" />
                <span>ชื่อผู้ติดต่อหลัก (Contact Person)</span>
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                placeholder="เช่น คุณสมชาย (ผู้จัดการจัดซื้อ)"
                className="w-full px-3.5 py-2 rounded-xl text-sm bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                <Mail className="size-3.5 text-muted-foreground" />
                <span>อีเมล (Email)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="purchase@company.co.th"
                className="w-full px-3.5 py-2 rounded-xl text-sm bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                LINE ID / Channel Ref
              </label>
              <input
                type="text"
                value={lineId}
                onChange={e => setLineId(e.target.value)}
                placeholder="@company_line หรือ ID"
                className="w-full px-3.5 py-2 rounded-xl text-sm bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Primary Address */}
          <div className="pt-2 border-t border-border">
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
              <MapPin className="size-3.5 text-muted-foreground" />
              <span>ที่อยู่สำนักงานใหญ่ / สถานที่จัดส่งหลัก</span>
            </label>
            <input
              type="text"
              value={addressLine1}
              onChange={e => setAddressLine1(e.target.value)}
              placeholder="เลขที่, อาคาร, ซอย, ถนน"
              className="w-full px-3.5 py-2 rounded-xl text-sm bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary mb-3"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={subDistrict}
                onChange={e => setSubDistrict(e.target.value)}
                placeholder="ตำบล / แขวง"
                className="px-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                placeholder="อำเภอ / เขต"
                className="px-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={province}
                onChange={e => setProvince(e.target.value)}
                placeholder="จังหวัด"
                className="px-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                placeholder="รหัสไปรษณีย์"
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="thaiwatsadu"
              disabled={isSubmitting}
              className="rounded-xl font-bold shadow-xs min-w-[120px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </span>
              ) : (
                <span>+ บันทึกข้อมูลลูกค้า</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
