import { useState } from "react";
import { Settings, Bell, Users, Database, TestTube2, Loader2, Plus, Trash2, Check } from "lucide-react";
import { useEditor } from "@/hooks/useEditor";
import { useAlertSettings, useUpdateAlertSettings } from "@/hooks/useAlertSettings";
import { useNurses, useCreateNurse, useDeleteNurse } from "@/hooks/useNurses";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { useCreateForm } from "@/hooks/useForms";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SEED_CATEGORIES = [
  { name: "Defibrillation",            icon: "activity", color: "#ef4444", order: 0 },
  { name: "คลังยา",                    icon: "package",  color: "#7c3aed", order: 1 },
  { name: "รถฉุกเฉิน (Emergency Cart)", icon: "truck",    color: "#f59e0b", order: 2 },
  { name: "CMT Spill Kit",             icon: "flask",    color: "#10b981", order: 3 },
];

export default function SettingsPage() {
  const { isEditor } = useEditor();
  const { data: settings } = useAlertSettings();
  const updateSettings = useUpdateAlertSettings();
  const { data: nurses } = useNurses(false);
  const createNurse = useCreateNurse();
  const deleteNurse = useDeleteNurse();
  const { data: categories } = useCategories();

  const [lineToken, setLineToken] = useState("");
  const [lineEnabled, setLineEnabled] = useState(false);
  const [testingLine, setTestingLine] = useState(false);
  const [lineTestResult, setLineTestResult] = useState<"ok" | "error" | null>(null);
  const [lowStock, setLowStock] = useState(5);
  const [expiry, setExpiry] = useState(30);
  const [nurseName, setNurseName] = useState("");
  const [nurseRole, setNurseRole] = useState<"RN" | "NA" | "PN">("RN");
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useState(() => {
    if (settings) {
      setLineToken(settings.lineNotifyToken ?? "");
      setLineEnabled(settings.lineNotifyEnabled ?? false);
      setLowStock(settings.lowStockThreshold ?? 5);
      setExpiry(settings.expiryWarningDays ?? 30);
    }
  });

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await updateSettings.mutateAsync({
      lineNotifyToken: lineToken,
      lineNotifyEnabled: lineEnabled,
      lowStockThreshold: lowStock,
      expiryWarningDays: expiry,
    });
    setSavingSettings(false);
  };

  const handleTestLine = async () => {
    if (!lineToken) return;
    setTestingLine(true);
    setLineTestResult(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: lineToken,
          message: "✅ ทดสอบการแจ้งเตือน LINE จาก SMC Ward 15 สำเร็จ!",
        }),
      });
      setLineTestResult(res.ok ? "ok" : "error");
    } catch {
      setLineTestResult("error");
    }
    setTestingLine(false);
  };

  const handleAddNurse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nurseName.trim()) return;
    await createNurse.mutateAsync({ name: nurseName, role: nurseRole, active: true });
    setNurseName("");
  };

  const handleSeed = async () => {
    if (!confirm("สร้างข้อมูลเริ่มต้น (4 หมวดหมู่ + แบบบันทึก)? ข้อมูลเดิมจะไม่ถูกลบ")) return;
    setSeeding(true);
    try {
      const existingSnap = await getDocs(collection(db, "categories"));
      if (existingSnap.size > 0) {
        alert("มีข้อมูลอยู่แล้ว — ไม่ได้สร้างซ้ำ");
        setSeeding(false);
        return;
      }
      const catIds: Record<string, string> = {};
      for (const cat of SEED_CATEGORIES) {
        const ref = await addDoc(collection(db, "categories"), { ...cat, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        catIds[cat.name] = ref.id;
      }
      await addDoc(collection(db, "forms"), {
        categoryId: catIds["Defibrillation"],
        name: "แบบบันทึกการตรวจสอบ Defibrillator ประจำวัน",
        description: "ตรวจสอบสภาพและความพร้อมใช้งานเครื่อง Defibrillator",
        scheduleType: "per_shift",
        shifts: ["morning", "afternoon", "night"],
        reminderEnabled: true,
        ward: "หอผู้ป่วยพิเศษชั้น 15",
        active: true,
        fields: [
          { id: "f1", label: "หมายเลขเครื่อง",         type: "text",   required: true,  order: 0 },
          { id: "f2", label: "สถานะเครื่อง",           type: "select", required: true,  options: ["พร้อมใช้งาน","ซ่อมบำรุง","ชำรุด"], order: 1 },
          { id: "f3", label: "ระดับแบตเตอรี่ (%)",     type: "number", required: true,  unit: "%",   minValue: 20, order: 2 },
          { id: "f4", label: "ผลการทดสอบ Self-test",   type: "select", required: true,  options: ["ผ่าน","ไม่ผ่าน"], order: 3 },
          { id: "f5", label: "หมายเหตุ / ปัญหาที่พบ",  type: "text",   hasIssueFlag: true, order: 4 },
          { id: "f6", label: "รูปถ่ายหน้าจอเครื่อง",   type: "file",   order: 5 },
        ],
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "forms"), {
        categoryId: catIds["คลังยา"],
        name: "แบบบันทึกคลังยาและเวชภัณฑ์",
        description: "ตรวจนับและบันทึกปริมาณยาและเวชภัณฑ์ในคลัง",
        scheduleType: "per_shift",
        shifts: ["morning", "afternoon", "night"],
        reminderEnabled: true,
        ward: "หอผู้ป่วยพิเศษชั้น 15",
        active: true,
        fields: [
          { id: "f1", label: "Morphine 10mg/mL (ampule)",  type: "number", required: true, unit: "หลอด", minValue: 5, order: 0 },
          { id: "f2", label: "Adrenaline 1mg/mL (ampule)", type: "number", required: true, unit: "หลอด", minValue: 5, order: 1 },
          { id: "f3", label: "0.9% NSS 100mL (bag)",       type: "number", required: true, unit: "ถุง",  minValue: 5, order: 2 },
          { id: "f4", label: "ยาที่ใกล้หมดอายุ",          type: "text",  hasIssueFlag: true, order: 3 },
          { id: "f5", label: "รูปถ่ายตู้ยา",              type: "file",  order: 4 },
        ],
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "forms"), {
        categoryId: catIds["รถฉุกเฉิน (Emergency Cart)"],
        name: "แบบบันทึกรถฉุกเฉิน Emergency Cart",
        description: "ตรวจสอบอุปกรณ์และยาในรถฉุกเฉินประจำวัน",
        scheduleType: "per_shift",
        shifts: ["morning", "afternoon", "night"],
        reminderEnabled: true,
        ward: "หอผู้ป่วยพิเศษชั้น 15",
        active: true,
        fields: [
          { id: "f1", label: "หมายเลขซีล",               type: "text",      required: true, order: 0 },
          { id: "f2", label: "ซีลสภาพสมบูรณ์",           type: "select",    required: true, options: ["ใช่","ไม่ใช่"], hasIssueFlag: true, order: 1 },
          { id: "f3", label: "ET Tube Size 7, 7.5, 8",   type: "checklist", required: true, options: ["Size 7","Size 7.5","Size 8"], order: 2 },
          { id: "f4", label: "Defibrillator ติดกับรถ",   type: "select",    required: true, options: ["ใช่","ไม่ใช่"], hasIssueFlag: true, order: 3 },
          { id: "f5", label: "หมายเหตุ",                  type: "text",      order: 4 },
          { id: "f6", label: "รูปถ่ายซีลและรถ",          type: "file",      order: 5 },
        ],
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "forms"), {
        categoryId: catIds["CMT Spill Kit"],
        name: "แบบบันทึก CMT Spill Kit",
        description: "ตรวจสอบชุดอุปกรณ์ทำลายยา Cytotoxic",
        scheduleType: "daily",
        shifts: [],
        reminderEnabled: true,
        ward: "หอผู้ป่วยพิเศษชั้น 15",
        active: true,
        fields: [
          { id: "f1", label: "ถุงมือ Chemo (คู่)",         type: "number", required: true, unit: "คู่",   minValue: 2, order: 0 },
          { id: "f2", label: "ชุด Gown (ชุด)",             type: "number", required: true, unit: "ชุด",   minValue: 1, order: 1 },
          { id: "f3", label: "หน้ากาก N95 (ชิ้น)",         type: "number", required: true, unit: "ชิ้น",  minValue: 2, order: 2 },
          { id: "f4", label: "สภาพชุด Spill Kit",         type: "select", required: true, options: ["สมบูรณ์","ต้องเติมของ","ต้องเปลี่ยน"], hasIssueFlag: true, order: 3 },
        ],
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "nurses"), { name: "พว.สมใจ ดีเสมอ",  role: "RN", active: true, createdAt: serverTimestamp() });
      await addDoc(collection(db, "nurses"), { name: "พว.มาลี สุขสันต์", role: "RN", active: true, createdAt: serverTimestamp() });
      await addDoc(collection(db, "nurses"), { name: "ผช.ณัฐ มีสุข",    role: "NA", active: true, createdAt: serverTimestamp() });
      setSeedDone(true);
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e);
    }
    setSeeding(false);
  };

  if (!isEditor) {
    return (
      <div className="glass-card p-8 text-center mt-8">
        <Settings size={32} className="mx-auto mb-3 opacity-30" />
        <p className="opacity-60" style={{ color: "var(--tx-primary)" }}>
          ต้องเข้าโหมด Editor เพื่อเข้าถึงการตั้งค่า
        </p>
        <p className="text-xs opacity-40 mt-1">กดปุ่มโล่ มุมล่างขวา</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold" style={{ color: "var(--tx-primary)" }}>การตั้งค่า</h1>

      <section className="glass-card p-5 flex flex-col gap-4">
        <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--tx-primary)" }}>
          <Database size={16} style={{ color: "var(--accent-violet)" }} /> ข้อมูลเริ่มต้นระบบ
        </h2>
        <p className="text-sm opacity-70">สำหรับการติดตั้งครั้งแรก — สร้างหมวดหมู่ทั้ง 4 และแบบบันทึกตัวอย่าง</p>
        <button onClick={handleSeed} disabled={seeding || seedDone}
          className={`btn-primary self-start flex items-center gap-2 ${seedDone ? "opacity-60" : ""}`}>
          {seeding ? <Loader2 size={16} className="animate-spin" /> : seedDone ? <Check size={16} /> : <Plus size={16} />}
          {seedDone ? "สร้างข้อมูลแล้ว" : seeding ? "กำลังสร้าง..." : "สร้างข้อมูลเริ่มต้น"}
        </button>
        {categories && categories.length > 0 && (
          <p className="text-xs text-emerald-700">✓ มีหมวดหมู่ {categories.length} รายการในระบบแล้ว</p>
        )}
      </section>

      <section className="glass-card p-5 flex flex-col gap-4">
        <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--tx-primary)" }}>
          <Bell size={16} style={{ color: "var(--accent-violet)" }} /> LINE Notify
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setLineEnabled(!lineEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${lineEnabled ? "bg-violet-500" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${lineEnabled ? "left-5" : "left-0.5"}`} />
            </div>
            <span className="text-sm" style={{ color: "var(--tx-primary)" }}>เปิดใช้งานการแจ้งเตือน</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>
            LINE Notify Token
          </label>
          <input type="password" value={lineToken} onChange={(e) => setLineToken(e.target.value)}
            placeholder="วาง token จาก notify-bot.line.me"
            className="input-glass" />
          <p className="text-xs opacity-50 mt-1">
            รับ token ได้ที่ <a href="https://notify-bot.line.me" target="_blank" rel="noopener noreferrer"
              className="underline text-violet-600">notify-bot.line.me</a>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleTestLine} disabled={!lineToken || testingLine}
            className="btn-ghost flex items-center gap-2 text-sm">
            {testingLine ? <Loader2 size={14} className="animate-spin" /> : <TestTube2 size={14} />}
            ทดสอบส่ง LINE
          </button>
          {lineTestResult === "ok"    && <span className="badge-ok">ส่งสำเร็จ ✓</span>}
          {lineTestResult === "error" && <span className="badge-error">ส่งไม่สำเร็จ ✗</span>}
        </div>
      </section>

      <section className="glass-card p-5 flex flex-col gap-4">
        <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--tx-primary)" }}>
          <Bell size={16} style={{ color: "var(--accent-amber)" }} /> การแจ้งเตือนของต่ำ / หมดอายุ
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>
              แจ้งเตือนเมื่อต่ำกว่า (ชิ้น)
            </label>
            <input type="number" value={lowStock} min={0}
              onChange={(e) => setLowStock(Number(e.target.value))}
              className="input-glass" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>
              เตือนล่วงหน้าหมดอายุ (วัน)
            </label>
            <input type="number" value={expiry} min={1}
              onChange={(e) => setExpiry(Number(e.target.value))}
              className="input-glass" />
          </div>
        </div>
        <button onClick={handleSaveSettings} disabled={savingSettings}
          className="btn-primary self-start flex items-center gap-2">
          {savingSettings ? <Loader2 size={16} className="animate-spin" /> : null}
          บันทึกการตั้งค่า
        </button>
      </section>

      <section className="glass-card p-5 flex flex-col gap-4">
        <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--tx-primary)" }}>
          <Users size={16} style={{ color: "var(--accent-sky)" }} /> จัดการพยาบาล / เจ้าหน้าที่
        </h2>
        <form onSubmit={handleAddNurse} className="flex gap-2">
          <input type="text" placeholder="ชื่อ-นามสกุล" value={nurseName}
            onChange={(e) => setNurseName(e.target.value)}
            className="input-glass flex-1" />
          <select value={nurseRole} onChange={(e) => setNurseRole(e.target.value as "RN" | "NA" | "PN")}
            className="input-glass w-20">
            <option value="RN">RN</option>
            <option value="NA">NA</option>
            <option value="PN">PN</option>
          </select>
          <button type="submit" disabled={!nurseName.trim()} className="btn-primary px-3">
            <Plus size={16} />
          </button>
        </form>
        <div className="flex flex-col gap-2">
          {nurses?.map((n) => (
            <div key={n.id} className="flex items-center justify-between bg-white/30 rounded-xl px-4 py-2.5">
              <div>
                <span className="font-medium text-sm" style={{ color: "var(--tx-primary)" }}>{n.name}</span>
                <span className="ml-2 badge-info">{n.role}</span>
                {!n.active && <span className="ml-2 text-xs opacity-40">(ไม่ใช้งาน)</span>}
              </div>
              <button onClick={() => deleteNurse.mutateAsync(n.id)}
                className="text-rose-400 hover:text-rose-600 p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {nurses?.length === 0 && (
            <p className="text-sm opacity-50 text-center py-2">ยังไม่มีรายชื่อ</p>
          )}
        </div>
      </section>
    </div>
  );
}
