import { useParams, Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Plus, ClipboardList, AlertCircle } from "lucide-react";
import { useForms } from "@/hooks/useForms";
import { useRecords } from "@/hooks/useRecords";
import { useClock } from "@/hooks/useClock";
import RecordModal from "@/components/RecordModal";

const SHIFT_LABEL: Record<string, string> = {
  morning:   "เช้า",
  afternoon: "บ่าย",
  night:     "ดึก",
};

const THAI_MONTHS = [
  "ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.",
  "ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค.",
];

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

export default function FormPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;
  const { data: allForms } = useForms();
  const { data: records, isLoading } = useRecords(formId);
  const { todayKey } = useClock();
  const [showModal, setShowModal] = useState(false);

  const form = allForms?.find((f) => f.id === formId);

  if (!form) return (
    <div className="glass-card p-8 text-center mt-8">
      <p className="opacity-50" style={{ color: "var(--tx-primary)" }}>
        {isLoading ? "กำลังโหลด..." : "ไม่พบแบบบันทึกนี้"}
      </p>
    </div>
  );

  const todayRecords = records?.filter((r) => r.recordDate === todayKey) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base truncate" style={{ color: "var(--tx-primary)" }}>{form.name}</h1>
          {form.description && (
            <p className="text-xs opacity-60 mt-0.5 truncate">{form.description}</p>
          )}
        </div>
      </div>

      <div className="glass-card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--tx-primary)" }}>วันนี้: {todayRecords.length} รายการ</p>
          <p className="text-xs opacity-60">{formatDate(todayKey)}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> บันทึกข้อมูล
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="text-center py-8 opacity-50 text-sm">กำลังโหลด...</div>
        ) : records && records.length > 0 ? (
          records.map((rec) => (
            <div key={rec.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: "var(--tx-primary)" }}>
                    {formatDate(rec.recordDate)}
                  </span>
                  {rec.shift && (
                    <span className="badge-info">{SHIFT_LABEL[rec.shift] ?? rec.shift}</span>
                  )}
                  {rec.hasLowStock && <span className="badge-warn">ของต่ำกว่าเกณฑ์</span>}
                  {rec.hasIssues && <span className="badge-error">มีปัญหา</span>}
                </div>
                <p className="text-xs opacity-50 shrink-0">{rec.recordedBy}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rec.values.map((rv) => {
                  const field = form.fields.find((f) => f.id === rv.fieldId);
                  if (!field) return null;
                  const isIssue = rv.hasIssue;
                  return (
                    <div key={rv.fieldId}
                      className={`flex items-start gap-2 text-sm p-2 rounded-lg ${isIssue ? "bg-amber-50/60" : "bg-white/20"}`}>
                      {isIssue && <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />}
                      <span className="opacity-60 shrink-0">{field.label}:</span>
                      <span className="font-medium break-all" style={{ color: "var(--tx-primary)" }}>
                        {Array.isArray(rv.value) ? rv.value.join(", ") :
                         typeof rv.value === "string" && rv.value.startsWith("http") ?
                           <a href={rv.value} target="_blank" rel="noopener noreferrer" className="text-violet-600 underline text-xs">ดูไฟล์</a> :
                         rv.value?.toString() ?? "-"}
                        {field.unit && <span className="opacity-50 ml-1 text-xs">{field.unit}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-8 text-center">
            <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
            <p className="opacity-50 text-sm" style={{ color: "var(--tx-primary)" }}>ยังไม่มีการบันทึกข้อมูล</p>
            <button onClick={() => setShowModal(true)}
              className="btn-primary mt-4 text-sm flex items-center gap-2 mx-auto">
              <Plus size={14} /> บันทึกข้อมูลแรก
            </button>
          </div>
        )}
      </div>

      {showModal && <RecordModal form={form} onClose={() => setShowModal(false)} />}
    </div>
  );
}
