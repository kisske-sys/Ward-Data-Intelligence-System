import { useState, useRef } from "react";
import { X, Loader2, Upload, AlertCircle } from "lucide-react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { type FormTemplate } from "@/hooks/useForms";
import { useCreateRecord } from "@/hooks/useRecords";
import { useNurses } from "@/hooks/useNurses";
import { useClock } from "@/hooks/useClock";
import { useAlertSettings } from "@/hooks/useAlertSettings";

interface Props {
  form: FormTemplate;
  onClose: () => void;
}

export default function RecordModal({ form, onClose }: Props) {
  const { todayKey } = useClock();
  const { data: nurses } = useNurses();
  const { data: settings } = useAlertSettings();
  const createRecord = useCreateRecord();

  const [values, setValues] = useState<Record<string, string | number | string[]>>({});
  const [shift, setShift] = useState(form.shifts[0] ?? "morning");
  const [recordedBy, setRecordedBy] = useState("");
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setValue = (fieldId: string, value: string | number | string[]) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileUpload = async (fieldId: string, file: File) => {
    setUploading((p) => ({ ...p, [fieldId]: true }));
    try {
      const path = `uploads/${Date.now()}_${file.name}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setValue(fieldId, url);
    } catch (e) {
      alert("อัปโหลดไม่สำเร็จ: " + e);
    } finally {
      setUploading((p) => ({ ...p, [fieldId]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = form.fields.filter((f) => f.required);
    for (const f of required) {
      if (!values[f.id] && values[f.id] !== 0) {
        alert(`กรุณากรอก: ${f.label}`);
        return;
      }
    }
    setLoading(true);
    const threshold = settings?.lowStockThreshold ?? 5;
    const recordValues = form.fields.map((f) => ({
      fieldId: f.id,
      value: values[f.id] ?? null,
      hasIssue: f.type === "number" && f.minValue !== undefined
        ? Number(values[f.id] ?? 0) < f.minValue
        : false,
    }));
    const hasLowStock = recordValues.some((rv) => {
      const field = form.fields.find((f) => f.id === rv.fieldId);
      return field?.type === "number" && typeof rv.value === "number" && rv.value < threshold;
    });
    await createRecord.mutateAsync({
      formId: form.id,
      recordDate: todayKey,
      shift,
      recordedBy,
      values: recordValues,
      hasLowStock,
      hasExpired: false,
      hasIssues: recordValues.some((rv) => rv.hasIssue),
    });
    setLoading(false);
    onClose();
  };

  const shiftLabel: Record<string, string> = {
    morning: "เช้า (07:00-15:00)",
    afternoon: "บ่าย (15:00-23:00)",
    night: "ดึก (23:00-07:00)",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-8 bg-black/30 overflow-y-auto">
      <div className="glass-strong rounded-2xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/30">
          <div>
            <h2 className="font-bold text-base" style={{ color: "var(--tx-primary)" }}>{form.name}</h2>
            {form.description && (
              <p className="text-xs opacity-60 mt-0.5" style={{ color: "var(--tx-primary)" }}>{form.description}</p>
            )}
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {form.scheduleType === "per_shift" && form.shifts.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>เวร</label>
              <select value={shift} onChange={(e) => setShift(e.target.value)} className="input-glass">
                {form.shifts.map((s) => (
                  <option key={s} value={s}>{shiftLabel[s] ?? s}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>
              ผู้บันทึก
            </label>
            <select value={recordedBy} onChange={(e) => setRecordedBy(e.target.value)} className="input-glass">
              <option value="">-- เลือกชื่อ --</option>
              {nurses?.map((n) => (
                <option key={n.id} value={n.name}>{n.name} ({n.role})</option>
              ))}
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>

          {form.fields.sort((a, b) => a.order - b.order).map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>
                {field.label}
                {field.required && <span className="text-rose-500 ml-1">*</span>}
                {field.unit && <span className="text-xs opacity-50 ml-1">({field.unit})</span>}
              </label>

              {field.type === "text" && (
                <input type="text" value={(values[field.id] as string) ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  className="input-glass" />
              )}
              {field.type === "number" && (
                <div className="relative">
                  <input type="number" value={(values[field.id] as number) ?? ""}
                    onChange={(e) => setValue(field.id, Number(e.target.value))}
                    min={0} className="input-glass pr-10" />
                  {field.minValue !== undefined && typeof values[field.id] === "number"
                    && (values[field.id] as number) < field.minValue && (
                    <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500" />
                  )}
                </div>
              )}
              {field.type === "date" && (
                <input type="date" value={(values[field.id] as string) ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  className="input-glass" />
              )}
              {field.type === "select" && (
                <select value={(values[field.id] as string) ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  className="input-glass">
                  <option value="">-- เลือก --</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              {field.type === "checklist" && (
                <div className="flex flex-wrap gap-2">
                  {field.options?.map((opt) => {
                    const checked = ((values[field.id] as string[]) ?? []).includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => {
                          const cur = (values[field.id] as string[]) ?? [];
                          setValue(field.id, checked ? cur.filter((x) => x !== opt) : [...cur, opt]);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                          checked
                            ? "bg-violet-100 border-violet-400 text-violet-800 font-semibold"
                            : "bg-white/40 border-white/60 text-slate-600"
                        }`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {field.type === "file" && (
                <div>
                  <input type="file" accept="image/*,.pdf"
                    ref={(el) => { fileRefs.current[field.id] = el; }}
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(field.id, file); }}
                    className="hidden" />
                  <button type="button"
                    onClick={() => fileRefs.current[field.id]?.click()}
                    disabled={uploading[field.id]}
                    className="btn-ghost flex items-center gap-2 text-sm">
                    {uploading[field.id]
                      ? <><Loader2 size={16} className="animate-spin" /> กำลังอัปโหลด...</>
                      : <><Upload size={16} /> เลือกไฟล์/รูปภาพ</>}
                  </button>
                  {values[field.id] && (
                    <p className="text-xs text-emerald-700 mt-1 truncate">
                      ✓ อัปโหลดแล้ว: <a href={values[field.id] as string} target="_blank" rel="noopener noreferrer" className="underline">ดูไฟล์</a>
                    </p>
                  )}
                </div>
              )}
              {field.type === "signature" && (
                <input type="text" placeholder="ลงชื่อ / ชื่อ-นามสกุล"
                  value={(values[field.id] as string) ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  className="input-glass" />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">ยกเลิก</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
