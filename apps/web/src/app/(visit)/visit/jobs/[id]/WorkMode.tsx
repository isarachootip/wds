'use client'

import { useState, useRef, useTransition } from 'react'

type ChecklistItem = { id: string; item: string; checked: boolean; note?: string | null }
type Photo = { id: string; storagePath: string; kind: string; caption?: string | null }
type JobItem = { id: string; description: string; qty: number; unit: string; unitPriceSatang: number; source: string }

type Props = {
  jobId: string
  initialItems: JobItem[]
  initialPhotos: Photo[]
  initialChecklists: ChecklistItem[]
  onItemsChange: (items: JobItem[]) => void
  onPhotosChange: (photos: Photo[]) => void
  onChecklistsChange: (checklists: ChecklistItem[]) => void
}

// Compress image using Canvas API
async function compressImage(file: File, maxSizePx = 1200, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxSizePx || height > maxSizePx) {
        const ratio = Math.min(maxSizePx / width, maxSizePx / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('compression failed'))
      }, 'image/webp', quality)
    }
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}

export function WorkMode({
  jobId, initialItems, initialPhotos, initialChecklists,
  onItemsChange, onPhotosChange, onChecklistsChange
}: Props) {
  const [items, setItems] = useState(initialItems)
  const [photos, setPhotos] = useState(initialPhotos)
  const [checklists, setChecklists] = useState(initialChecklists)
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'checklist' | 'items' | 'photos'>('checklist')
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemQty, setNewItemQty] = useState('1')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('ชิ้น')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Array<{ id: string; sku: string; name: string; unit: string; basePriceSatang: number }>>([])
  const [photoKind, setPhotoKind] = useState<'before' | 'during' | 'after' | 'issue'>('after')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSearchProducts(query: string) {
    setNewItemDesc(query)
    setSelectedProductId(null)
    if (query.trim().length >= 2) {
      try {
        const { searchProductsAction } = await import('@/modules/visit/actions')
        const res = await searchProductsAction(query)
        if (res.success && res.products) {
          setSearchResults(res.products)
        }
      } catch {
        setSearchResults([])
      }
    } else {
      setSearchResults([])
    }
  }

  function handleSelectProduct(p: { id: string; name: string; unit: string; basePriceSatang: number }) {
    setNewItemDesc(p.name)
    setNewItemPrice((p.basePriceSatang / 100).toString())
    setNewItemUnit(p.unit)
    setSelectedProductId(p.id)
    setSearchResults([])
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Compress image
      const compressed = await compressImage(file)

      // For now: store as blob URL in local state (real implementation uploads to Supabase Storage)
      // In production: upload to Supabase Storage and get storagePath
      const localUrl = URL.createObjectURL(compressed)
      const storagePath = `jobs/${jobId}/${Date.now()}.webp` // placeholder path

      const { recordPhotoAction } = await import('@/modules/visit/actions')
      const result = await recordPhotoAction(jobId, storagePath, photoKind, undefined)
      if (result.success && result.photoId) {
        const newPhoto = { id: result.photoId, storagePath: localUrl, kind: photoKind, caption: null }
        const updated = [...photos, newPhoto]
        setPhotos(updated)
        onPhotosChange(updated)
      }
    } catch {
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleChecklistToggle(id: string, checked: boolean) {
    const { updateChecklistItemAction } = await import('@/modules/visit/actions')
    startTransition(async () => {
      await updateChecklistItemAction(id, checked, undefined, jobId)
      const updated = checklists.map(c => c.id === id ? { ...c, checked } : c)
      setChecklists(updated)
      onChecklistsChange(updated)
    })
  }

  async function handleAddItem() {
    if (!newItemDesc.trim()) return
    const priceBaht = parseFloat(newItemPrice) || 0
    startTransition(async () => {
      const { addJobItemAction } = await import('@/modules/visit/actions')
      const result = await addJobItemAction(jobId, {
        productId: selectedProductId ?? undefined,
        description: newItemDesc,
        qty: parseInt(newItemQty) || 1,
        unit: newItemUnit,
        unitPriceSatang: Math.round(priceBaht * 100),
      }, 'current-user-id')
      if (result.success) {
        const newItem: JobItem = {
          id: Date.now().toString(),
          description: newItemDesc,
          qty: parseInt(newItemQty) || 1,
          unit: newItemUnit,
          unitPriceSatang: Math.round(priceBaht * 100),
          source: 'added_onsite',
        }
        const updated = [...items, newItem]
        setItems(updated)
        onItemsChange(updated)
        setNewItemDesc('')
        setNewItemQty('1')
        setNewItemPrice('')
        setNewItemUnit('ชิ้น')
        setSelectedProductId(null)
      }
    })
  }

  const checkedCount = checklists.filter(c => c.checked).length

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {[
          { key: 'checklist', label: `Checklist (${checkedCount}/${checklists.length})` },
          { key: 'items', label: `รายการ (${items.length})` },
          { key: 'photos', label: `รูป (${photos.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Checklist tab */}
        {activeTab === 'checklist' && (
          <div className="space-y-2">
            {checklists.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">ยังไม่มี checklist</p>
            ) : (
              checklists.map(item => (
                <label key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={e => handleChecklistToggle(item.id, e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className={`text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {item.item}
                  </span>
                </label>
              ))
            )}
          </div>
        )}

        {/* Items tab */}
        {activeTab === 'items' && (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.description}</p>
                  <p className="text-xs text-gray-500">{item.qty} {item.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    ฿{((item.unitPriceSatang / 100) * item.qty).toLocaleString('th-TH')}
                  </p>
                  {item.source === 'added_onsite' && (
                    <span className="text-xs text-blue-600">+ เพิ่มหน้างาน</span>
                  )}
                </div>
              </div>
            ))}

            {/* Add item form */}
            <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-gray-600">+ เพิ่มรายการ (ค้นหาจากสินค้า/เพิ่มหน้างาน)</p>
              <div className="relative">
                <input
                  type="text"
                  value={newItemDesc}
                  onChange={e => handleSearchProducts(e.target.value)}
                  placeholder="พิมพ์ค้นหาวัสดุหรือสินค้า (เช่น ปูน, กระเบื้อง)..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {searchResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className="w-full text-left p-2.5 hover:bg-blue-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">{p.name}</p>
                          <p className="text-gray-400 font-mono text-[10px]">{p.sku}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-medium text-blue-600">฿{(p.basePriceSatang / 100).toLocaleString('th-TH')}</p>
                          <p className="text-gray-400 text-[10px]">/{p.unit}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newItemQty}
                  onChange={e => setNewItemQty(e.target.value)}
                  min="1"
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="จำนวน"
                />
                <input
                  type="text"
                  value={newItemUnit}
                  onChange={e => setNewItemUnit(e.target.value)}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="หน่วย"
                />
                <input
                  type="number"
                  value={newItemPrice}
                  onChange={e => setNewItemPrice(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="ราคา/หน่วย (บาท)"
                />
              </div>
              <button
                onClick={handleAddItem}
                disabled={isPending || !newItemDesc.trim()}
                className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {isPending ? 'กำลังเพิ่ม...' : '+ บันทึกรายการ (added_onsite)'}
              </button>
            </div>
          </div>
        )}

        {/* Photos tab */}
        {activeTab === 'photos' && (
          <div className="space-y-3">
            {/* Kind selector */}
            <div className="flex gap-2">
              {(['before', 'during', 'after', 'issue'] as const).map(k => (
                <button
                  key={k}
                  onClick={() => setPhotoKind(k)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                    photoKind === k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {k === 'before' ? 'ก่อน' : k === 'during' ? 'ระหว่าง' : k === 'after' ? 'หลัง' : 'ปัญหา'}
                </button>
              ))}
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-3 gap-2">
              {photos.filter(p => p.kind === photoKind).map(photo => (
                <div key={photo.id} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={photo.storagePath}
                    alt={photo.kind}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              {/* Upload button */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-blue-400 disabled:opacity-50"
              >
                {uploading ? (
                  <span className="text-xs text-gray-400">กำลังอัปโหลด...</span>
                ) : (
                  <>
                    <span className="text-2xl">📸</span>
                    <span className="text-xs text-gray-500 mt-1">ถ่ายรูป</span>
                  </>
                )}
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        )}
      </div>
    </div>
  )
}
