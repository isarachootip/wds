'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  BookOpen,
  Search,
  Sparkles,
  Users,
  MapPin,
  FileText,
  ShieldCheck,
  Truck,
  BarChart3,
  HelpCircle,
  Clock,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Layers,
  GraduationCap,
  Lightbulb,
  Building2,
  TrendingUp,
  Filter,
  X,
} from 'lucide-react'
import {
  KM_ARTICLES,
  KM_CATEGORIES,
  KM_LIFECYCLE_STEPS,
  KmArticle,
  KmCategory,
} from './km-data'
import { ArticleModal } from './ArticleModal'

const ICON_MAP: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4 text-amber-500" />,
  Users: <Users className="w-4 h-4 text-blue-500" />,
  MapPin: <MapPin className="w-4 h-4 text-emerald-500" />,
  FileText: <FileText className="w-4 h-4 text-indigo-500" />,
  ShieldCheck: <ShieldCheck className="w-4 h-4 text-rose-500" />,
  Truck: <Truck className="w-4 h-4 text-orange-500" />,
  BarChart3: <BarChart3 className="w-4 h-4 text-cyan-500" />,
  HelpCircle: <HelpCircle className="w-4 h-4 text-violet-500" />,
}

const ALL_ROLES = [
  'ทุกบทบาท (All Roles)',
  'Sales',
  'Coordinator',
  'Technician',
  'Accounting',
  'Warehouse',
  'Driver',
  'Sales Manager',
  'Admin',
]

export function KmHub() {
  const searchParams = useSearchParams()
  const initialArticleId = searchParams.get('article')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('ทุกบทบาท (All Roles)')
  const [selectedArticle, setSelectedArticle] = useState<KmArticle | null>(null)
  const [showLifecycle, setShowLifecycle] = useState(true)

  // Check URL param on mount or change
  useEffect(() => {
    if (initialArticleId) {
      const found = KM_ARTICLES.find((a) => a.id === initialArticleId)
      if (found) {
        setSelectedArticle(found)
      }
    }
  }, [initialArticleId])

  // Filter articles
  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return KM_ARTICLES.filter((article) => {
      // Category filter
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false
      }

      // Role filter
      if (
        selectedRole !== 'ทุกบทบาท (All Roles)' &&
        !article.roles.includes(selectedRole) &&
        !article.roles.includes('All Roles')
      ) {
        return false
      }

      // Search query
      if (q) {
        const inTitle = article.title.toLowerCase().includes(q)
        const inSummary = article.summary.toLowerCase().includes(q)
        const inCategory = article.categoryLabel.toLowerCase().includes(q)
        const inRoles = article.roles.some((r) => r.toLowerCase().includes(q))
        const inSections = article.sections.some(
          (s) => s.heading.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
        )
        return inTitle || inSummary || inCategory || inRoles || inSections
      }

      return true
    })
  }, [searchQuery, selectedCategory, selectedRole])

  // Featured Spotlight Article
  const featuredArticle = useMemo(() => {
    return KM_ARTICLES.find((a) => a.isFeatured) || KM_ARTICLES[0]
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 text-foreground">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <GraduationCap className="w-4 h-4" />
            <span>ศูนย์การเรียนรู้และคลังความรู้มาตรฐาน • Thai Watsadu WDS</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            คลังความรู้และคู่มือระบบ (Knowledge Hub)
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            คู่มือการปฏิบัติงานฉบับสมบูรณ์ กฎระเบียบทางธุรกิจ 12 ขั้นตอน และแนวคิดหลักของระบบการขายและบริการติดตั้ง WDS
          </p>

          {/* Search Bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาคู่มือ, ขั้นตอนการทำงาน, ความแตกต่าง ลูกค้า vs ลีด, กฎสินเชื่อ..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Role Filter Select */}
            <div className="relative sm:w-64">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-xs cursor-pointer"
              >
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Featured Core Concept Spotlight (Customers vs Leads vs Pipeline) */}
      {!searchQuery && selectedCategory === 'all' && (
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-primary text-primary-foreground shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  แนวคิดหลักที่ต้องรู้ (Core Concept)
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  ความสัมพันธ์ 1 Customer : N Leads $\rightarrow$ Pipeline 7 ขั้น
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                ลูกค้า (Customer) vs ลีด (Lead) vs Sales Pipeline ต่างกันอย่างไร?
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed">
                ทำความเข้าใจความสัมพันธ์แบบ 3 ระดับ: <strong>ลูกค้า</strong> (คู่ค้าถาวร/วงเงินเครดิต) $\rightarrow$ <strong>ลีด</strong> (โอกาสทางการขายเฉพาะโปรเจกต์) $\rightarrow$ <strong>Sales Pipeline</strong> (กระดานติดตาม 7 ขั้นตอน) เพื่อการทำงานร่วมกันที่ราบรื่นและแม่นยำ
              </p>

              {/* Mini Concept Visual */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-card border border-border text-xs space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" /> 1. ลูกค้า (Customer)
                  </div>
                  <p className="text-muted-foreground">คู่ค้าถาวร, Tax ID 13 หลัก, วงเงินเครดิต, หลายไซต์งาน GPS</p>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border text-xs space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-500" /> 2. ลีด (Lead)
                  </div>
                  <p className="text-muted-foreground">โอกาสทางการขายแต่ละงาน, สเปกสินค้า, งบประมาณ, แหล่งที่มา</p>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border text-xs space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> 3. Sales Pipeline
                  </div>
                  <p className="text-muted-foreground">กระดาน 7 ขั้นตอน (ใหม่ ➜ Won/Lost), สลับมุมมอง Card/List ได้</p>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto">
              <button
                onClick={() => setSelectedArticle(featuredArticle)}
                className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>อ่านคู่มือฉบับเต็ม</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/wds/pipeline"
                className="w-full px-5 py-3 rounded-xl bg-card border border-border text-foreground font-bold text-sm hover:bg-muted transition-all flex items-center justify-center gap-2 shadow-xs text-center"
              >
                <span>เปิดหน้า Pipeline</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {KM_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id
          const count =
            cat.id === 'all'
              ? KM_ARTICLES.length
              : KM_ARTICLES.filter((a) => a.category === cat.id).length

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all shrink-0 border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border'
              }`}
            >
              {ICON_MAP[cat.iconName]}
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 4. Articles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>บทความและคู่มือทั้งหมด</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              {filteredArticles.length} รายการ
            </span>
          </h2>

          {selectedRole !== 'ทุกบทบาท (All Roles)' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>กรองเฉพาะบทบาท:</span>
              <span className="px-2 py-0.5 rounded-md font-bold bg-primary/10 text-primary border border-primary/20">
                {selectedRole}
              </span>
              <button
                onClick={() => setSelectedRole('ทุกบทบาท (All Roles)')}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                ล้าง
              </button>
            </div>
          )}
        </div>

        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-card border border-border space-y-3">
            <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold text-foreground">ไม่พบคู่มือที่ตรงกับเงื่อนไขค้นหา</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              ลองเปลี่ยนคำค้นหา หรือกดเลือกหมวดหมู่ "ทั้งหมด" เพื่อดูบทความที่มีอยู่
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedRole('ทุกบทบาท (All Roles)')
              }}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="group relative flex flex-col justify-between p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md cursor-pointer text-foreground"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      {article.categoryLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                {/* Bottom Footer */}
                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex flex-wrap gap-1">
                    {article.roles.slice(0, 2).map((r) => (
                      <span
                        key={r}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border"
                      >
                        {r}
                      </span>
                    ))}
                    {article.roles.length > 2 && (
                      <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                        +{article.roles.length - 2}
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 font-bold text-primary text-xs group-hover:translate-x-0.5 transition-transform">
                    <span>อ่านคู่มือ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Interactive 12-Step Lifecycle Explorer */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <Layers className="w-4 h-4" />
              <span>ผังกระบวนการทำงาน 12 ขั้นตอน (WDS 12-Step Lifecycle)</span>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              เส้นทางการทำงานตั้งแต่ Lead $\rightarrow$ งานช่าง $\rightarrow$ สั่งซื้อ $\rightarrow$ ส่งมอบสินค้า
            </h2>
          </div>
          <button
            onClick={() => setShowLifecycle(!showLifecycle)}
            className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border bg-muted/50"
          >
            {showLifecycle ? 'ซ่อนผังงาน' : 'แสดงผังงาน'}
          </button>
        </div>

        {showLifecycle && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {KM_LIFECYCLE_STEPS.map((step) => (
              <Link
                key={step.step}
                href={step.route}
                className="p-3.5 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-muted/40 transition-all flex flex-col justify-between space-y-2 group shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center border border-primary/20">
                      {step.step}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                      {step.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {step.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{step.role}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Full Article Reader Modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onSelectRelated={(articleId) => {
            const found = KM_ARTICLES.find((a) => a.id === articleId)
            if (found) setSelectedArticle(found)
          }}
        />
      )}
    </div>
  )
}
