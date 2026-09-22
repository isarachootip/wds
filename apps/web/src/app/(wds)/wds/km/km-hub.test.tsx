import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { KmHub } from './KmHub'
import { ArticleModal } from './ArticleModal'
import { KM_ARTICLES, KM_CATEGORIES, KM_LIFECYCLE_STEPS } from './km-data'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

describe('KM Hub (Knowledge Management System on Website)', () => {
  it('1. Renders the KM Hub header, banner and search bar in HTML', () => {
    const html = renderToString(<KmHub />)
    expect(html).toContain('คลังความรู้และคู่มือระบบ (Knowledge Hub)')
    expect(html).toContain('ศูนย์การเรียนรู้และคลังความรู้มาตรฐาน • Thai Watsadu WDS')
    expect(html).toContain('ค้นหาคู่มือ, ขั้นตอนการทำงาน, ความแตกต่าง ลูกค้า vs ลีด, กฎสินเชื่อ...')
  })

  it('2. Renders all 9 KM categories with their labels', () => {
    const html = renderToString(<KmHub />)
    KM_CATEGORIES.forEach((cat) => {
      expect(html).toContain(escapeHtml(cat.label))
    })
  })

  it('3. Renders the Featured Spotlight for Customer vs Lead vs Pipeline', () => {
    const html = renderToString(<KmHub />)
    expect(html).toContain('ลูกค้า (Customer) vs ลีด (Lead) vs Sales Pipeline ต่างกันอย่างไร?')
    expect(html).toContain('แนวคิดหลักที่ต้องรู้ (Core Concept)')
    expect(html).toContain('อ่านคู่มือฉบับเต็ม')
  })

  it('4. Renders the 12-Step Lifecycle diagram correctly', () => {
    const html = renderToString(<KmHub />)
    expect(html).toContain('ผังกระบวนการทำงาน 12 ขั้นตอน (WDS 12-Step Lifecycle)')
    KM_LIFECYCLE_STEPS.forEach((step) => {
      expect(html).toContain(escapeHtml(step.title))
    })
  })

  it('5. Renders Article Modal with full content, code snippet, and FAQs', () => {
    const spotlightArticle = KM_ARTICLES.find((a) => a.id === 'customer-lead-pipeline')!
    const modalHtml = renderToString(
      <ArticleModal article={spotlightArticle} onClose={vi.fn()} />
    )

    expect(modalHtml).toContain('สาระสำคัญโดยสรุป')
    expect(modalHtml).toContain('1. ภาพรวมโครงสร้าง 3 ระดับ (3-Tier CRM Architecture)')
    expect(modalHtml).toContain('2. ตารางเปรียบเทียบเชิงลึก 5 มิติ')
    expect(modalHtml).toContain('3. ตัวอย่างสถานการณ์จริงในการปฏิบัติงาน')
    expect(modalHtml).toContain('คำถามที่พบบ่อย (Q&amp;A)')
    expect(modalHtml).toContain('ปิดหน้าต่าง')
  })

  it('6. Verifies all KM articles have valid required fields and sections', () => {
    expect(KM_ARTICLES.length).toBeGreaterThanOrEqual(10)
    KM_ARTICLES.forEach((article) => {
      expect(article.id).toBeTruthy()
      expect(article.title).toBeTruthy()
      expect(article.summary).toBeTruthy()
      expect(article.sections.length).toBeGreaterThan(0)
      expect(article.roles.length).toBeGreaterThan(0)
    })
  })

  it('7. Verifies Cruip design tokens are strictly followed (no prohibited hardcoded classes)', () => {
    const html = renderToString(<KmHub />)
    expect(html).not.toContain('bg-white')
    expect(html).not.toContain('text-slate-900')
    expect(html).not.toContain('border-gray-200')
  })
})
