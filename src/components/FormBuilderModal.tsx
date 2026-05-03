import { useState } from "react";
import { X, Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import { type FormTemplate, type FormField, useCreateForm, useUpdateForm } from "@/hooks/useForms";

interface Props {
  categoryId: string;
  form?: FormTemplate;
  onClose: () => void;
}

const FIELD_TYPES = [
  { value: "text",      label: "ข้อความ" },
  { value: "number",    label: "ตัวเลข" },
  { value: "date",      label: "วันที่" },
  { value: "select",    label: "เลือก (dropdown)" },
  { value: "checklist", label: "เช็กลิสต์" },
  { value: "file",      label: "ไฟล์/รูปภาพ" },
  { value: "signature", label: "ลายเซ็น/ชื่อ" },
];

function makeId() { return Math.random().toString(36).slice(2, 8); }

export default function FormBuilderModal({ categoryId, form, onClose }: Props) {
  const createForm = useCreateForm();
  const updateForm = useUpdateForm();
  const isEdit = !!form;

  const [name, setName] = useState(form?.name ?? "");
  const [description, setDescription] = useState(form?.description ?? "");
  const [scheduleType, setScheduleType] = useState<"daily" | "per_shift">(form?.scheduleType ?? "per_shift");
  const [shifts, setShifts] = useState<string[]>(form?.shifts ?? ["morning", "afternoon", "night"]);
  const [ward, setWard] = useState(form?.ward ?? "หอผู้ป่วยพิเศษชั้น 15");
  const [fields, setFields] = useState<FormField[]>(form?.fields ?? []);
  const [loading, setLoading] = useState(false);

  const toggleShift = (s: string) =>
    setShifts((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { id: makeId(), label: "", type: "text", required: false, order: prev.length },
    ]);
  };

  const updateField = (id: string, patch: Partial<FormField>) =>
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f));

  const removeField = (id: string) =>
    setFields((prev) => prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert("กรุณาใส่ชื่อแบบบันทึก"); return; }
    if (fields.length === 0) { alert("กรุณาเพิ่มช่องข้อมูลอย่างน้อย 1 ช่อง"); return; }
    setLoading(true);
    const data = { categoryId, name, description, scheduleType, shifts, ward, fields, reminderEnabled: true, active: true };
    if (isEdit) {
      await updateForm.mutateAsync({ id: form.id, data });
    } else {
      await createForm.mutateAsync(data);
    }
    setLoading(false);
    onClose();
  };

  const SHIFT_OPTS = [
    { key: "morning",   label: "เช้า" },
    { key: "afternoon", label: "บ่าย" },
    { key: "night",     label: "ดึก" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-8 bg-black/30 overflow-y-auto">
      <div className="glass-strong rounded-2xl w-full max-w-2xl my-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/30">
          <h2 className="font-bold text-base" style={{ color: "var(--tx-primary)" }}>
            {isEdit ? "แก้ไขแบบบันทึก" : "สร้างแบบบันทึกใหม่"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>
              ชื่อแบบบันทึก <span className="text-rose-500">*</span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="เช่น แบบบันทึกการตรวจสอบ Defibrillator ประจำวัน"
              className="input-glass" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>คำอธิบาย</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              className="input-glass" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>รูปแบบ</label>
              <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value as "daily" | "per_shift")}
                className="input-glass">
                <option value="per_shift">ต่อเวร</option>
                <option value="daily">รายวัน</option>
              </select>
            </div>
            {scheduleType === "per_shift" && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>เวรที่บันทึก</label>
                <div className="flex gap-2">
                  {SHIFT_OPTS.map(({ key, label }) => (
                    <button key={key} type="button"
                      onClick={() => toggleShift(key)}
                      className={`flex-1 py-1.5 rounded-xl text-sm border transition-all ${
                        shifts.includes(key)
                          ? "bg-violet-100 border-violet-400 text-violet-800 font-semibold"
                          : "bg-white/40 border-white/60 text-slate-500"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold" style={{ color: "var(--tx-primary)" }}>
                ช่องข้อมูล ({fields.length})
              </label>
              <button type="button" onClick={addField}
                className="flex items-center gap-1.5 text-sm text-violet-700 hover:text-violet-900 font-medium">
                <Plus size={16} /> เพิ่มช่อง
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="glass-card p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="opacity-30 shrink-0" />
                    <span className="text-xs font-bold text-violet-600 w-5 shrink-0">{idx + 1}.</span>
                    <input type="text" placeholder="ชื่อช่อง / คำถาม" value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="input-glass flex-1 text-sm" />
                    <select value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value as FormField["type"] })}
                      className="input-glass w-36 text-sm shrink-0">
                      {FIELD_TYPES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeField(field.id)}
                      className="text-rose-400 hover:text-rose-600 shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 pl-9">
                    {(field.type === "select" || field.type === "checklist") && (
                      <input type="text"
                        placeholder="ตัวเลือก 1, ตัวเลือก 2, ..."
                        value={field.options?.join(", ") ?? ""}
                        onChange={(e) => updateField(field.id, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                        className="input-glass text-sm flex-1" />
                    )}
                    {field.type === "number" && (
                      <input type="number" placeholder="ค่าต่ำสุด (แจ้งเตือน)"
                        value={field.minValue ?? ""}
                        onChange={(e) => updateField(field.id, { minValue: e.target.value ? Number(e.target.value) : undefined })}
                        className="input-glass text-sm w-40" />
                    )}
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={!!field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })} />
                      บังคับกรอก
                    </label>
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <div className="text-center py-6 opacity-40 text-sm" style={{ color: "var(--tx-primary)" }}>
                  ยังไม่มีช่องข้อมูล — กด "เพิ่มช่อง" เพื่อเริ่ม
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">ยกเลิก</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? "บันทึกการแก้ไข" : "สร้างแบบบันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
