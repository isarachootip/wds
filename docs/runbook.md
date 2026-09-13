---

## 🔴 ระบบล่ม (Site Down)

### ตรวจสอบ
1. เปิด https://wds.yourdomain.com/api/health
   - ตอบ `{"status":"ok"}` → Next.js ทำงาน, ปัญหาอยู่ที่อื่น
   - ตอบ `{"status":"degraded","db":{"status":"error"}}` → DB มีปัญหา
   - ไม่ตอบเลย → Server/CDN มีปัญหา

### ขั้นตอน
1. Vercel Dashboard → กด Redeploy บน deployment ก่อนหน้า

---

## 🟡 Domain Events ค้าง

### ตรวจสอบ
1. เปิด **/wds/admin/events**
2. ดูจำนวน Failed / Dead Letter events

### แก้ไข
- **กด "Process All Pending"** — สั่ง worker ทำงานทันที
- หรือเรียก: `GET /api/cron/process-events?secret=CRON_SECRET`

### Dead Letter Events
- หาก event ค้างและ fail 5 ครั้ง → status=dead
- กด **Retry** เพื่อ reset และลองใหม่
- หาก retry ไม่ผ่านอีก ให้ตรวจ handler ที่ `src/workers/domain-events.ts`

---

## 🟡 LINE OA ไม่รับข้อความ

### ตรวจสอบ
1. ตรวจ `LINE_CHANNEL_SECRET` ใน environment variables
2. ตรวจ webhook URL ใน LINE Developer Console → ต้องเป็น https://wds.yourdomain.com/api/line/webhook
3. ทดสอบ: ส่งข้อความให้ LINE OA → ดูใน Vercel Logs ว่า webhook ถูกเรียกไหม

### แก้ไข
ทดสอบ signature ด้วย curl:
```bash
curl -X POST https://wds.yourdomain.com/api/line/webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: <valid_sig>" \
  -d '{"events":[]}'
```
ต้องตอบ `{"ok":true}`

---

## 🟡 Rate Limit เกินทำให้ถูก Block

ลูกค้าแจ้งว่าได้รับ 429:
1. ตรวจ Vercel Logs ว่า IP ไหนโดน
2. Rate limit reset ทุก 60 วินาทีเอง
3. หากต้องการ limit สูงขึ้น: แก้ใน `middleware.ts` → `RATE_LIMITS`
4. Production: ใช้ Upstash Redis แทน in-memory Map

---

## 🔴 กู้ข้อมูล (Data Recovery)

### Supabase Point-in-Time Recovery
1. ไปที่ Supabase Dashboard → Database → Backups
2. เลือก timestamp ที่ต้องการ
3. กด Restore (ใช้เวลา ~15 นาทีสำหรับ DB ขนาดปกติ)

### บันทึก Recovery Time
| วันที่ | เหตุการณ์ | เวลาที่ใช้ | ผู้ดำเนินการ |
|---|---|---|---|
| (ทดสอบ restore ครั้งแรก) | Test restore | - min | - |

### ข้อมูลที่ต้องตรวจหลัง Restore
- [ ] Lead + Lead Activities ยังครบ
- [ ] Quotation + Orders ยังครบ
- [ ] Payments ยังครบ (ไม่มีรายการหาย)
- [ ] Domain events ที่ pending ถูก re-process

---

## 🟡 Storage / รูปภาพหาย

1. ไปที่ Supabase Storage → ดูว่า bucket ยังมีไฟล์
2. ตรวจ Signed URL ว่ายังไม่หมดอายุ (ตั้งค่า 1 ชั่วโมง)
3. หากหายจริง: ขอจาก device ของช่าง/ลูกค้าแล้ว re-upload ด้วยมือ

---

## 📞 Escalation

| ระดับ | เงื่อนไข | ติดต่อ |
|---|---|---|
| P1 | ระบบล่มทั้งหมด > 5 นาที | CTO immediately |
| P2 | Feature สำคัญใช้ไม่ได้ > 30 นาที | Tech Lead |
| P3 | Bug ที่ workaround ได้ | Sprint backlog |
