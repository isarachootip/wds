'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  X,
  Clock,
  UserCheck,
  ExternalLink,
  Copy,
  Check,
  Printer,
  ChevronRight,
  Info,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Share2,
} from 'lucide-react'
import { KmArticle } from './km-data'

interface ArticleModalProps {
  article: KmArticle | null
  onClose: () => void
  onSelectRelated?: (articleId: string) => void
}

export function ArticleModal({ article, onClose, onSelectRelated }: ArticleModalProps) {
  const [copied, setCopied] = useState(false)

  if (!article) return null

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/wds/km?article=${article.id}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-border bg-muted/40">
          <div className="space-y-2 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {article.categoryLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
              {article.isFeatured && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                  ★ ไฮไลต์หลัก
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
              {article.title}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
                <UserCheck className="w-3.5 h-3.5" /> บทบาทที่เกี่ยวข้อง:
              </span>
              {article.roles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              title="คัดลอกลิงก์บทความ"
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handlePrint}
              title="พิมพ์เอกสาร"
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="ปิดหน้าต่าง"
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-foreground text-sm leading-relaxed">
          {/* Summary Box */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-foreground font-medium flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary mb-0.5">สาระสำคัญโดยสรุป</p>
              <p className="text-muted-foreground">{article.summary}</p>
            </div>
          </div>

          {/* Sections */}
          {article.sections.map((section, idx) => (
            <div key={idx} className="space-y-3 pt-2">
              <h3 className="text-base sm:text-lg font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {section.heading}
              </h3>
              <div className="text-foreground whitespace-pre-line leading-relaxed pl-1">
                {section.content}
              </div>

              {section.codeSnippet && (
                <div className="mt-3 p-3.5 rounded-lg bg-muted border border-border font-mono text-xs overflow-x-auto text-foreground whitespace-pre leading-normal">
                  {section.codeSnippet}
                </div>
              )}

              {section.alert && (
                <div
                  className={`mt-3 p-3.5 rounded-lg border flex items-start gap-3 text-xs leading-relaxed ${
                    section.alert.type === 'tip'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
                      : section.alert.type === 'warning'
                      ? 'bg-destructive/10 border-destructive/30 text-destructive'
                      : section.alert.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900'
                      : 'bg-primary/10 border-primary/30 text-primary'
                  }`}
                >
                  {section.alert.type === 'tip' && <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />}
                  {section.alert.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />}
                  {section.alert.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />}
                  {section.alert.type === 'info' && <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />}
                  <div>
                    <span className="font-bold mr-1">
                      {section.alert.type === 'tip' ? 'คำแนะนำ:' : section.alert.type === 'warning' ? 'ข้อควรระวัง:' : 'ข้อมูลสำคัญ:'}
                    </span>
                    <span>{section.alert.text}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* FAQs Section if exists */}
          {article.faqs && article.faqs.length > 0 && (
            <div className="pt-4 space-y-3">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                คำถามที่พบบ่อย (Q&A)
              </h3>
              <div className="space-y-3">
                {article.faqs.map((faq, fIdx) => (
                  <div key={fIdx} className="p-3.5 rounded-lg bg-muted/60 border border-border space-y-1.5">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      <span className="text-primary font-bold">Q:</span> {faq.q}
                    </p>
                    <p className="text-muted-foreground pl-5">
                      <span className="text-emerald-600 font-bold">A:</span> {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
          <div className="text-xs text-muted-foreground">
            ระบบ Thai Watsadu WDS • คลังความรู้มาตรฐาน
          </div>

          <div className="flex items-center gap-3">
            {article.actionLink && (
              <Link
                href={article.actionLink.href}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow-xs"
              >
                {article.actionLink.label}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border bg-card text-foreground font-medium text-xs hover:bg-muted transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
