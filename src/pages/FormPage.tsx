// src/pages/FormPage.tsx
// Performance fix: LINE Notify ถูกย้ายออกจาก critical path
// โดยใช้ fire-and-forget pattern (.catch() แทน await)
// ผู้ใช้กด Submit → Firestore save → UI update ทันที
// LINE Notify ส่งใน background ไม่บล็อก UI

import { useState, useCallback } from "react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft, Send, Download, Loader2,
  CheckCircle2, Clock, AlertCircle, FileSpreadsheet,
} from "lucide-react";
import { useForm, useCreateRecord, useRecords, type FormField } from "@/hooks/useForms";
import { useEditor } from "@/hooks/useEditor";

function todayStr() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
}

const SHIFT_LABEL: Record<string, string> = {
  morning: "เช้า (07:00-15:00)",
  afternoon: "บ่าย (15:00-23:00)",
  night: "ดึก (23:00-07:00)",
};
const SHIFT_SHORT: Record<string, string> = {
  morning: "เช้า", afternoon: "บ่าย", night: "ดึก",
};

export default function FormPage() {
  const [, params] = useRoute("/form/:id");
  const formId = params?.id;

  const { data: form, isLoading } = useForm(formId);
  const createRecord = useCreateRecord();
  const { data: records = [] } = useRecords(formId, todayStr());

  const [selectedShift, setSelectedShift] = useState("morning");
  const [recordedBy,    setRecordedBy]    = useState("");
  const [fieldValues,   setFieldValues]   = useState<Record<string, unknown>>({});
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);

  const handleFieldChange = useCallback((id: string, value: unknown) => {
    setFieldValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  // ─── Fire-and-Forget LINE Notify ──────────────────────
  // ส่งใน background ไม่ await ไม่บล็อก UI
  const sendLineNotify = useCallback(
    (formName: string, fields: FormField[], values: Record<string, unknown>) => {
      const token = localStorage.getItem("line_token");
      if (!token) return; // ไม่มี token = ข้ามไป

      const lines = fields.map((f) => `• ${f.label}: ${values[f.id] ?? "-"}`);
      const msg = [
        `📋 ${formName}`,
        `🕐 เวร${SHIFT_SHORT[selectedShift]}`,
        `👤 ${recordedBy}`,
        `📅 ${todayStr()}`,
        `─────`,
        ...lines,
      ].join("\n");

      // fire-and-forget: ไม่ await ไม่ throw
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, token }),
      }).catch(() => {
        // LINE fail ไม่กระทบ main flow
        console.warn("[LINE Notify] ส่งไม่สำเร็จ");
      });
    },
    [selectedShift, recordedBy]
  );

  // ─── Submit ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missing = form?.fields
      .filter((f) => f.required && !fieldValues[f.id])
      .map((f) => f.label) ?? [];

    if (missing.length) {
      alert(`กรุณากรอก: ${missing.join(", ")}`);
      return;
    }
    if (!recordedBy.trim()) {
      alert("กรุณาใส่ชื่อผู้บันทึก");
      return;
    }

    setSubmitting(true);
    try {
      // 1. บันทึก Firestore (Optimistic = UI อัปเดตทันที)
      await createRecord.mutateAsync({
        formId: form!.id,
        formName: form!.name,
        categoryId: form!.categoryId,
        shift: selectedShift,
        ward: form!.ward,
        recordedBy,
        data: fieldValues,
        date: todayStr(),
      });

      // 2. ส่ง LINE ใน background (ไม่ await)
      sendLineNotify(form!.name, form!.fields, fieldValues);

      // 3. Reset form
      setFieldValues({});
      setRecordedBy("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);

    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + String(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Export CSV ───────────────────────────────────────
  const handleExport = () => {
    if (!records.length || !form) {
      alert("ยังไม่มีข้อมูลวันนี้");
      return;
    }
    const headers = ["วันที่", "เวร", "ผู้บันทึก",
      ...form.fields.map((f) => f.label)];
    const rows = records.map((r) => [
      r.date,
      SHIFT_SHORT[r.shift] ?? r.shift,
      r.recordedBy,
      ...form.fields.map((f) => String(r.data[f.id] ?? "")),
    ]);

    // \uFEFF = BOM ทำให้ Excel อ่าน UTF-8 ภาษาไทยได้ถูกต้อง
    const csv = "\uFEFF" + [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `${form.name}_${todayStr()}.csv`;
    a.click();
  };

  // ─── Loading / Not Found ──────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-violet)" }} />
        <span style={{ color: "var(--tx-muted)" }}>กำลังโหลด…</span>
      </div>
    );
  }
  if (!form) {
    return (
      <div className="page-content flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-lg font-bold" style={{ color: "var(--tx-primary)" }}>
          ไม่พบแบบบันทึก
        </p>
        <Link href="/" className="btn-ghost">← กลับหน้าหลัก</Link>
      </div>
    );
  }

  const availableShifts = form.shifts?.length > 0
    ? form.shifts
    : ["morning", "afternoon", "night"];

  return (
    <div className="page-content animate-in">

      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="btn-ghost p-2 shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base leading-tight truncate"
            style={{ color: "var(--tx-primary)" }}>
            {form.name}
          </h2>
          <p className="text-xs opacity-55" style={{ color: "var(--tx-secondary)" }}>
            {form.ward} · {todayStr()}
          </p>
        </div>
        {/* Export button */}
        <button
          onClick={handleExport}
          title="Export CSV สำหรับ Excel"
          className="btn-ghost p-2 shrink-0"
        >
          <FileSpreadsheet size={18} />
        </button>
      </div>

      {/* ─── Success Banner ─── */}
      {submitted && (
        <div className="glass-card rounded-xl flex items-center gap-3 px-4 py-3 mb-4
                        border border-emerald-200/60 animate-in"
          style={{ background: "rgba(209,250,229,0.55)" }}>
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">บันทึกสำเร็จแล้ว!</p>
            <p className="text-xs text-emerald-600 opacity-80">
              {records.length} รายการวันนี้
            </p>
          </div>
        </div>
      )}

      {/* ─── Two-column on desktop ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ─── LEFT: Form Input ─── */}
        <form onSubmit={handleSubmit}
          className="flex flex-col gap-4 md:col-span-2 lg:col-span-1">

          {/* เลือกเวร */}
          {form.scheduleType === "per_shift" && (
            <div className="glass rounded-2xl p-4">
              <label className="flex items-center gap-2 text-sm font-semibold mb-3"
                style={{ color: "var(--tx-primary)" }}>
                <Clock size={15} style={{ color: "var(--accent-violet)" }} />
                เลือกเวร
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableShifts.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedShift(s)}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2
                                transition-all text-center
                      ${selectedShift === s
                        ? "border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-200"
                        : "border-white/50 bg-white/35 hover:bg-white/55"
                      }`}
                    style={selectedShift !== s ? { color: "var(--tx-secondary)" } : {}}
                  >
                    {SHIFT_SHORT[s] ?? s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ชื่อผู้บันทึก */}
          <div className="glass rounded-2xl p-4">
            <label className="block text-sm font-semibold mb-2"
              style={{ color: "var(--tx-primary)" }}>
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
          <div className="glass rounded-2xl p-4 flex flex-col gap-5">
            <p className="text-sm font-semibold flex items-center gap-2"
              style={{ color: "var(--tx-primary)" }}>
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--accent-violet)" }}
              />
              ข้อมูลที่ต้องบันทึก ({form.fields.length} รายการ)
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

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary py-3.5 text-base font-bold w-full
                       flex items-center justify-center gap-2"
          >
            {submitting
              ? <><Loader2 size={18} className="animate-spin" /> กำลังบันทึก…</>
              : <><Send size={18} /> บันทึกข้อมูล</>
            }
          </button>
        </form>

        {/* ─── RIGHT: Today's Record List ─── */}
        <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-1">
          {records.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "var(--tx-primary)" }}>
                  บันทึกวันนี้
                </p>
                <span className="badge badge-mint">{records.length} รายการ</span>
              </div>
              <div className="flex flex-col gap-2">
                {records.map((r) => (
                  <div
                    key={r.id}
                    className="glass-card rounded-xl px-4 py-3
                               flex items-center gap-3 animate-in"
                  >
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate"
                        style={{ color: "var(--tx-primary)" }}>
                        {r.recordedBy}
                      </p>
                      <p className="text-xs opacity-55"
                        style={{ color: "var(--tx-secondary)" }}>
                        เวร{SHIFT_SHORT[r.shift] ?? r.shift}
                      </p>
                    </div>
                    <span className="text-xs opacity-40 shrink-0"
                      style={{ color: "var(--tx-secondary)" }}>
                      {r.createdAt
                        ? new Date(
                            (r.createdAt as { seconds: number }).seconds * 1000
                          ).toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dynamic Field Renderer ───────────────────────────────────
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const strVal = value != null ? String(value) : "";

  const showWarning =
    field.type === "number" &&
    field.minValue !== undefined &&
    strVal !== "" &&
    Number(strVal) < field.minValue;

  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5"
        style={{ color: "var(--tx-primary)" }}>
        {field.label}
        {field.required && (
          <span className="text-rose-500 text-xs">*</span>
        )}
      </label>

      {field.type === "text" && (
        <input type="text" value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="input-glass" />
      )}

      {field.type === "number" && (
        <div>
          <input type="number" value={strVal}
            onChange={(e) => onChange(e.target.value)}
            className={`input-glass ${showWarning ? "border-amber-400 bg-amber-50/60" : ""}`} />
          {showWarning && (
            <p className="text-xs text-amber-700 flex items-center gap-1.5 mt-1.5
                          bg-amber-50/60 rounded-lg px-3 py-1.5">
              <AlertCircle size={12} />
              ค่าต่ำกว่าเกณฑ์ที่กำหนด ({field.minValue})
            </p>
          )}
        </div>
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
          <option value="">— เลือก —</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === "checklist" && (
        <div className="flex flex-col gap-1.5">
          {field.options?.map((opt) => {
            const arr   = Array.isArray(value) ? (value as string[]) : [];
            const checked = arr.includes(opt);
            return (
              <label key={opt}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                             text-sm cursor-pointer transition-colors
                  ${checked
                    ? "bg-violet-50/70 border border-violet-200"
                    : "glass-card hover:bg-white/40"}`}
              >
                <input type="checkbox" checked={checked}
                  onChange={() => {
                    onChange(checked ? arr.filter((x) => x !== opt) : [...arr, opt]);
                  }}
                  className="accent-violet-600 w-4 h-4 shrink-0" />
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
          className="input-glass
                     file:mr-3 file:py-1.5 file:px-3
                     file:rounded-lg file:border-0
                     file:bg-violet-100 file:text-violet-700
                     file:text-sm file:font-medium
                     file:cursor-pointer" />
      )}
    </div>
  );
}
