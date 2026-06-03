# RLS Policies Setup Guide

หากข้อมูลไม่แสดงผลในหน้า Legal Registry ให้ทำตามขั้นตอนนี้:

## วิธีที่ 1: รัน SQL Script ผ่าน Supabase Dashboard (แนะนำ)

1. ไปที่ Supabase Dashboard: https://supabase.com/dashboard
2. เลือก Project: `legal-registry` (exugnmdsyqbqtxsrwhbm)
3. ไปที่ SQL Editor
4. สร้าง Query ใหม่ (New Query)
5. Copy & Paste ข้อมูลทั้งหมดจากไฟล์ `scripts/setup-rls-policies.sql`
6. คลิก Run
7. Refresh Application (Ctrl+R)

## วิธีที่ 2: Disable RLS ชั่วคราว (สำหรับ Development)

ถ้าต้องการเร็ว ให้รัน SQL นี้แทน:

```sql
-- Disable RLS on all tables temporarily
ALTER TABLE law_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE laws DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE communication_matrix DISABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_summary DISABLE ROW LEVEL SECURITY;
```

> ⚠️ หมายเหตุ: วิธีนี้ไม่ปลอดภัยสำหรับ Production - ใช้เฉพาะสำหรับ Development เท่านั้น

## ขั้นตอนหลังจาก RLS Setup

1. ข้อมูลควรแสดงผล เมื่อ refresh page
2. ลองไปหน้า `/legal` - ควรเห็น law categories และสถิติ
3. ลองหน้า `/legal/repealed` - ควรเห็น cancelled laws
4. ลองหน้า `/legal/management-review` - ควรเห็น compliance logs
5. ลองหน้า `/communication-matrix` - ควรเห็น ISD-86 data
