# SMC Ward 15 — ระบบบันทึกข้อมูลหอผู้ป่วยพิเศษชั้น 15

**Santiram Medical Center · SMC Excellence Data Center**

ระบบบันทึกและติดตามข้อมูลหอผู้ป่วยพิเศษชั้น 15 สำหรับพยาบาลและเจ้าหน้าที่ รองรับการบันทึกข้อมูลรายวัน/รายเวร, การแจ้งเตือน LINE Notify, อัปโหลดไฟล์/รูป และปฏิทินการบันทึก

---

## ✨ ฟีเจอร์หลัก

- **4 หมวดหมู่เริ่มต้น**: Defibrillation, คลังยา, Emergency Cart, CMT Spill Kit
- **Dynamic Form Builder**: สร้าง/แก้ไข/ลบแบบบันทึกได้ไม่จำกัด พร้อมช่องกรอกหลายประเภท
- **รายวัน / รายเวร**: บันทึกแบบรายวันหรือแยกตามเวร เช้า-บ่าย-ดึก
- **ปฏิทิน Thai Buddhist Calendar**: เห็นสถานะการบันทึกรายวัน พร้อมสีแสดงสถานะ
- **LINE Notify**: แจ้งเตือนอัตโนมัติผ่าน LINE เมื่อบันทึกข้อมูล / มีของใกล้หมด / มีปัญหา
- **อัปโหลดไฟล์ & รูปภาพ**: แนบไฟล์หรือถ่ายรูปจากกล้องในแบบบันทึก
- **Editor Mode**: ระบบล็อกรหัสผ่านสำหรับ Editor ที่แก้ไขหมวดหมู่และฟอร์ม
- **Pastel Minimal Frosted Glass UI**: ธีมพาสเทลมินิมอล กระจกขุ่น รองรับ Thai language

---

## 🗂️ โครงสร้าง Project (pnpm Monorepo)

```
workspace/
├── artifacts/
│   ├── smc-ward15/          # React + Vite Frontend (Tailwind v4, wouter, react-query)
│   └── api-server/          # Express 5 API Server (pino, express-session, multer)
├── lib/
│   ├── db/                  # Drizzle ORM + PostgreSQL schema
│   ├── api-spec/            # OpenAPI spec (contract-first)
│   ├── api-zod/             # Zod schemas (auto-generated)
│   └── api-client-react/    # React Query hooks (auto-generated)
├── scripts/                 # Seed scripts
└── pnpm-workspace.yaml
```

---

## 🚀 วิธีติดตั้งและรัน

### ความต้องการ

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### 1. Clone และติดตั้ง

```bash
git clone <repo-url>
cd workspace
pnpm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ที่ root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/smc_ward15
SESSION_SECRET=your-secret-key-here
EDITOR_PASSWORD=admin1234
PORT=8080
```

สร้างไฟล์ `artifacts/smc-ward15/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### 3. ตั้งค่าฐานข้อมูล

```bash
# Push schema ไปยัง PostgreSQL
pnpm --filter @workspace/db run push

# Seed ข้อมูลเริ่มต้น (หมวดหมู่ + แบบฟอร์ม + พยาบาล)
pnpm --filter @workspace/scripts run seed
```

### 4. รัน Development

```bash
# Terminal 1 - API Server
pnpm --filter @workspace/api-server run dev

# Terminal 2 - Frontend
pnpm --filter @workspace/smc-ward15 run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:21296`

---

## 🔑 การเข้าสู่ระบบ Editor

- กดปุ่ม **"สำหรับ Editor"** มุมล่างขวา
- รหัสผ่านเริ่มต้น: `admin1234`
- เปลี่ยนได้ผ่าน environment variable `EDITOR_PASSWORD`

---

## 📱 LINE Notify

1. ไปที่ [notify-bot.line.me](https://notify-bot.line.me/)
2. Login ด้วยบัญชี LINE
3. กด "Generate token" และเลือกกลุ่มหรือแชทที่ต้องการแจ้งเตือน
4. คัดลอก Token
5. ไปที่ **การตั้งค่า** ในแอป → วาง Token → กด **ทดสอบ**

---

## 📁 API Endpoints หลัก

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| GET | `/api/categories` | รายการหมวดหมู่ทั้งหมด |
| GET | `/api/forms` | รายการแบบบันทึก |
| POST | `/api/records` | บันทึกข้อมูลใหม่ |
| GET | `/api/dashboard/summary` | สรุปภาพรวม |
| POST | `/api/upload` | อัปโหลดไฟล์ |
| POST | `/api/notify/line/test` | ทดสอบ LINE Notify |
| POST | `/api/notify/line` | ส่งแจ้งเตือน LINE |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 7, Tailwind CSS v4, wouter, TanStack Query |
| Backend | Express 5, Node.js, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Auth | express-session |
| File Upload | multer |
| Notifications | LINE Notify API |
| Fonts | Sarabun (Thai), Inter |

---

## 🗄️ Database Schema

- `categories` — หมวดหมู่แบบบันทึก
- `form_templates` — แบบบันทึก (fields เป็น JSONB)
- `records` — ข้อมูลที่บันทึก
- `nurses` — รายชื่อพยาบาล
- `alert_settings` — การตั้งค่าการแจ้งเตือน (รวม LINE token)
- `issues` — การรายงานปัญหา

---

## 📝 License

Internal use — Santiram Medical Center, Ward 15

---

*พัฒนาโดย หอผู้ป่วยพิเศษชั้น 15 · SMC Excellence Data Center*
