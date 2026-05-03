# SMC Ward 15 — Firebase + Vercel Version

**Santiram Medical Center · หอผู้ป่วยพิเศษชั้น 15**

ระบบบันทึกข้อมูลหอผู้ป่วย รองรับ: แบบบันทึกรายวัน/รายเวร, LINE Notify, อัปโหลดรูป, 4 หมวดหมู่หลัก  
**Stack**: React + Vite + Tailwind v4 + Firebase Firestore + Firebase Storage + Vercel

---

## 🚀 ขั้นตอน Deploy (GitHub → Firebase → Vercel)

### ขั้นที่ 1 — สร้าง Firebase Project (ฟรี)

1. ไปที่ [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. ตั้งชื่อ เช่น `smc-ward15` → ปิด Analytics (ไม่จำเป็น) → **Create project**
3. เปิดใช้ **Firestore Database**:
   - ไปที่ **Firestore Database** → **Create database**
   - เลือก **Start in test mode** (แก้ rules ทีหลังได้) → เลือก Region `asia-southeast1 (Singapore)`
4. เปิดใช้ **Storage**:
   - ไปที่ **Storage** → **Get started** → **Start in test mode** → Singapore
5. รับ **Firebase Config**:
   - ไปที่ **Project Settings** (เฟือง) → **Your apps** → กด `</>` (Web)
   - ตั้งชื่อ app → **Register app**
   - Copy ค่า `firebaseConfig` (จะใช้ใน Vercel)

### ขั้นที่ 2 — Push ขึ้น GitHub

```bash
git init
git add .
git commit -m "SMC Ward 15 - Firebase + Vercel"
git remote add origin https://github.com/YOUR_USERNAME/smc-ward15.git
git push -u origin main
```

### ขั้นที่ 3 — Deploy บน Vercel

1. ไปที่ [vercel.com](https://vercel.com) → **New Project** → Import GitHub repo
2. Vercel จะ auto-detect Vite framework — กด **Deploy** ได้เลย
3. หลัง deploy เสร็จ ไปที่ **Settings → Environment Variables** → เพิ่มทุกค่าเหล่านี้:

| Variable | ค่า |
|----------|-----|
| `VITE_FIREBASE_API_KEY` | จาก Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | จาก Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | จาก Firebase config |
| `VITE_FIREBASE_STORAGE_BUCKET` | จาก Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | จาก Firebase config |
| `VITE_FIREBASE_APP_ID` | จาก Firebase config |
| `EDITOR_PASSWORD` | รหัสผ่าน Editor ที่ต้องการ |
| `JWT_SECRET` | random string ยาวๆ อย่างน้อย 32 ตัวอักษร |
| `LINE_NOTIFY_TOKEN` | (optional) token จาก notify-bot.line.me |

4. ไปที่ **Deployments** → กด **Redeploy** หลังเพิ่ม env vars

### ขั้นที่ 4 — ตั้งค่าข้อมูลเริ่มต้น

1. เปิดแอปที่ได้จาก Vercel
2. กดปุ่ม **โล่** มุมล่างขวา → ใส่รหัสผ่าน Editor
3. ไปที่ **การตั้งค่า** → กด **"สร้างข้อมูลเริ่มต้น"**
4. ระบบจะสร้าง 4 หมวดหมู่ + แบบบันทึกตัวอย่าง + พยาบาล 3 คน

**เสร็จแล้ว!** 🎉

---

## 🔐 Firestore Security Rules (แนะนำให้ตั้งก่อน go-live)

ไปที่ Firebase Console → **Firestore** → **Rules** → วางโค้ดนี้:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // อนุญาตทุกคนอ่าน (internal system)
    match /{document=**} {
      allow read: if true;
      allow write: if true; // แก้เป็น false หลัง go-live ถ้าต้องการ Auth
    }
  }
}
```

> ⚠️ สำหรับระบบภายในโรงพยาบาลที่ไม่ได้เปิด public — Test mode เพียงพอ

---

## 📱 ตั้งค่า LINE Notify

1. ไปที่ [notify-bot.line.me](https://notify-bot.line.me/)
2. Login → **My page** → **Generate token**
3. เลือกกลุ่ม LINE → Copy token
4. ในแอป: **การตั้งค่า** → วาง token → กด **ทดสอบส่ง LINE**

---

## 🛠️ รันบนเครื่องตัวเอง

```bash
# 1. Copy env
cp .env.example .env.local
# แก้ค่า VITE_FIREBASE_* ให้ตรงกับ Firebase project ของคุณ

# 2. ติดตั้ง
npm install

# 3. รัน
npm run dev
```

---

## ✨ ฟีเจอร์

- 📋 Dynamic form builder — สร้าง/แก้ไขแบบบันทึกได้เองทั้งหมด
- 📅 ปฏิทิน Thai Buddhist Calendar พร้อมสีแสดงสถานะ
- 🔔 LINE Notify แจ้งเตือนอัตโนมัติ
- 📷 อัปโหลดรูปภาพ/ไฟล์ ผ่าน Firebase Storage
- ⚠️ แจ้งเตือนของใกล้หมด/ต่ำกว่าเกณฑ์
- 🔒 Editor mode ระบบรหัสผ่าน + JWT
- 🌸 Pastel Glass UI ภาษาไทย
- ☁️ Firebase Firestore (realtime, ฟรี 50k reads/day)

---

*พัฒนาโดยทีมหอผู้ป่วยพิเศษชั้น 15 · Santiram Medical Center*
