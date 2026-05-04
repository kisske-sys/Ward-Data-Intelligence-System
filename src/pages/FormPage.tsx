// src/pages/FormPage.tsx
import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft, Send, Download, Loader2,
  CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import { useForm, useCreateRecord, useRecords } from "@/hooks/useForms";
import { useEditor } from "@/hooks/useEditor";

// วันที่วันนี้ในรูปแบบ YYYY-MM-DD (timezone ไทย)
function todayStr() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
}

// ชื่อเวรภาษาไทย
const SHIFT_LABEL: Record<string, string> = {
  morning: "เช้า", afternoon: "บ่าย", night: "ดึก",
};

export default function FormPage() {
  const [, params] = useRoute("/form/:id");
  const formId = params?.id;
  const { isEditor } = useEditor();

  const { data: form, isLoading } = useForm(formId);
  const createRecord = useCreateRecord();
  const { data: records = [] } = useRecords(formId, todayStr());

  const [selectedShift, setSelectedShift] = useState("morning");
  const [recordedBy, setRecordedBy]       = useState("");
  const [fieldValues, setFieldValues]     = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [lineToken, setLineToken]         = useState(
    localStorage.getItem("line_token") ?? ""
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-violet-500" />
      </div>
    );
  }
  if (!form) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center">
        <p className="text-lg font-bold mb-3" style={{ color: "var(--tx-primary)" }}>
          ไม่พบแบบบันทึก
        </p>
        <Link href="/" className="btn-ghost">← กลับหน้าหลัก</Link>
      </div>
    );
  }

  const handleFieldChange = (id: string, value: unknown) =>
    setFieldValues((prev) => ({ ...prev, [id]: value }));

  // ─── Submit ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ตรวจ required fields
    const missing = form.fields
      .filter((f) => f.required && !fieldValues[f.id])
      .map((f) => f.label);
    if (missing.length) {
      alert(`กรุณากรอก: ${missing.join(", ")}`);
      return;
    }
    if (!recordedBy.trim()) { alert("กรุณาใส่ชื่อผู้บันทึก"); return; }

    setSubmitting(true);
    try {
      await createRecord.mutateAsync({
        formId: form.id,
        formName: form.name,
        categoryId: form.categoryId,
        shift: selectedShift,
        ward: form.ward,
        recordedBy,
        data: fieldValues,
        date: todayStr(),
      });

      // ส่ง LINE Notify
      const token = lineToken || localStorage.getItem("line_token");
      if (token) {
        const lines = form.fields.map(
          (f) => `• ${f.label}: ${fieldValues[f.id] ?? "-"}`
        );
        const msg = [
          `📋 ${form.name}`,
          `🕐 เวร${SHIFT_LABEL[selectedShift] ?? selectedShift}`,
          `👤 ${recordedBy}`,
          `📅 ${todayStr()}`,
          `─────────`,
          ...lines,
        ].join("\n");

        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, token }),
        }).catch(() => null); // ถ้า LINE fail ไม่ต้องหยุดงาน
      }

      setSubmitted(true);
      setFieldValues({});
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + String(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Export CSV ──────────────────────────────────
  const handleExport = () => {
    if (!records.length) { alert("ยังไม่มีข้อมูลวันนี้"); return; }

    const headers = ["วันที่", "เวร", "ผู้บันทึก", ...form.fields.map((f) => f.label)];
    const rows = records.map((r) => [
      r.date,
      SHIFT_LABEL[r.shift] ?? r.shift,
      r.recordedBy,
      ...form.fields.map((f) => String(r.data[f.id] ?? "")),
    ]);

    // BOM สำหรับ Excel อ่าน UTF-8 ภาษาไทยได้
    const bom  = "\uFEFF";
    const csv  = bom + [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${form.name}_${todayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 animate-in">

      {/* ─── Back + Title ─── */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base truncate" style={{ color: "var(--tx-primary)" }}>
            {form.name}
          </h2>
          <p className="text-xs opacity-55" style={{ color: "var(--tx-secondary)" }}>
            {form.ward} · {todayStr()}
          </p>
        </div>
        {/* Export CSV */}
        <button onClick={handleExport} className="btn-ghost p-2" title="Export CSV">
          <Download size={18} />
        </button>
      </div>

      {/* ─── Success Banner ─── */}
      {submitted && (
        <div className="glass-card rounded-xl flex items-center gap-3 px-4 py-3 mb-4
                        bg-emerald-50/60 border border-emerald-200">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">บันทึกสำเร็จแล้ว!</p>
        </div>
      )}

      {/* ─── Form ─── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* เลือกเวร */}
        {form.scheduleType === "per_shift" && (
          <div className="glass-card rounded-xl p-4">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--tx-primary)" }}>
              <Clock size={14} className="inline mr-1.5" />
              เลือกเวร
            </label>
            <div className="flex gap-2">
              {(form.shifts.length ? form.shifts : ["morning","afternoon","night"]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedShift(s)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
                    ${selectedShift === s
                      ? "bg-violet-600 text-white border-violet-600 shadow-md"
                      : "bg-white/40 border-white/60 text-slate-600 hover:bg-white/60"
                    }`}
                >
                  {SHIFT_LABEL[s] ?? s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ชื่อผู้บันทึก */}
        <div className="glass-card rounded-xl p-4">
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--tx-primary)" }}>
            ชื่อผู้บันทึก <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={recordedBy}
            onChange={(e) => setRecordedBy(e.target.value)}
            placeholder="ชื่อ-นามสกุล หรือรหัสพนักงาน"
            className="input-glass"
          />
        </div>

        {/* Dynamic Fields */}
        <div className="glass-card rounded-xl p-4 flex flex-col gap-4">
          <p className="text-sm font-semibold" style={{ color: "var(--tx-primary)" }}>
            ข้อมูลที่ต้องบันทึก
          </p>
          {form.fields
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={fieldValues[field.id]}
                onChange={(v) => handleFieldChange(field.id, v)}
              />
            ))}
        </div>

        {/* LineToken (ถัดลงมา) */}
        <details className="glass-card rounded-xl p-4">
          <summary className="text-sm font-medium cursor-pointer select-none"
            style={{ color: "var(--tx-muted)" }}>
            📱 ตั้งค่า LINE Notify Token (ไม่บังคับ)
          </summary>
          <div className="mt-3">
            <input
              type="password"
              value={lineToken}
              onChange={(e) => {
                setLineToken(e.target.value);
                localStorage.setItem("line_token", e.target.value);
              }}
              placeholder="TOKEN จาก notify.line.me"
              className="input-glass"
            />
            <p className="text-xs mt-1.5 opacity-50" style={{ color: "var(--tx-secondary)" }}>
              Token จะบันทึกเฉพาะในเครื่องนี้ ไม่ส่งไปที่อื่น
            </p>
          </div>
        </details>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex items-center justify-center gap-2 py-3 text-base"
        >
          {submitting
            ? <Loader2 size={18} className="animate-spin" />
            : <Send size={18} />
          }
          {submitting ? "กำลังบันทึก…" : "บันทึกข้อมูล"}
        </button>
      </form>

      {/* ─── Today's Records ─── */}
      {records.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--tx-primary)" }}>
            บันทึกวันนี้ ({records.length} รายการ)
          </p>
          <div className="flex flex-col gap-2">
            {records.map((r) => (
              <div key={r.id} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--tx-primary)" }}>
                    เวร{SHIFT_LABEL[r.shift] ?? r.shift} — {r.recordedBy}
                  </p>
                </div>
                <span className="text-xs opacity-40" style={{ color: "var(--tx-secondary)" }}>
                  {r.createdAt
                    ? new Date(
                        (r.createdAt as { seconds: number }).seconds * 1000
                      ).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dynamic Field Renderer ───────────────────────────
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: import("@/hooks/useForms").FormField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const strVal = value != null ? String(value) : "";

  // ─── Warning สำหรับ number ที่ต่ำกว่า minValue ───
  const showWarning =
    field.type === "number" &&
    field.minValue !== undefined &&
    strVal !== "" &&
    Number(strVal) < field.minValue;

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--tx-primary)" }}>
        {field.label}
        {field.required && <span className="text-rose-500 ml-1">*</span>}
      </label>

      {field.type === "text" && (
        <input type="text" value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="input-glass" />
      )}

      {field.type === "number" && (
        <>
          <input type="number" value={strVal}
            onChange={(e) => onChange(e.target.value)}
            className="input-glass" />
          {showWarning && (
            <p className="text-xs text-amber-700 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              ค่าต่ำกว่าเกณฑ์ ({field.minValue})
            </p>
          )}
        </>
      )}

      {field.type === "date" && (
        <input type="date" value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="input-glass" />
      )}

      {field.type === "select" && (
        <select value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="input-glass">
          <option value="">-- เลือก --</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === "checklist" && (
        <div className="flex flex-col gap-1.5">
          {field.options?.map((opt) => {
            const arr = Array.isArray(value) ? (value as string[]) : [];
            const checked = arr.includes(opt);
            return (
              <label key={opt}
                className="flex items-center gap-2 text-sm cursor-pointer
                           glass-card rounded-xl px-3 py-2">
                <input type="checkbox" checked={checked}
                  onChange={() => {
                    onChange(checked ? arr.filter((x) => x !== opt) : [...arr, opt]);
                  }}
                  className="accent-violet-600 w-4 h-4" />
                <span style={{ color: "var(--tx-primary)" }}>{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {field.type === "signature" && (
        <input type="text" value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ชื่อ-นามสกุล (ลงชื่อ)"
          className="input-glass" />
      )}

      {field.type === "file" && (
        <input type="file"
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
          className="input-glass file:mr-3 file:py-1 file:px-3 file:rounded-lg
                     file:border-0 file:bg-violet-100 file:text-violet-700 file:text-sm" />
      )}
    </div>
  );
}
