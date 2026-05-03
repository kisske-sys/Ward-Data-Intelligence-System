import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useIssues, useUpdateIssue, type Issue } from "@/hooks/useIssues";
import { useEditor } from "@/hooks/useEditor";

const STATUS_LABEL: Record<Issue["status"], string> = {
  open:        "เปิดอยู่",
  in_progress: "กำลังดำเนินการ",
  resolved:    "แก้ไขแล้ว",
};
const STATUS_CLASS: Record<Issue["status"], string> = {
  open:        "badge-error",
  in_progress: "badge-warn",
  resolved:    "badge-ok",
};

export default function IssuesPage() {
  const [filter, setFilter] = useState<Issue["status"] | "all">("all");
  const { data: issues, isLoading } = useIssues(filter === "all" ? undefined : filter);
  const { isEditor } = useEditor();
  const updateIssue = useUpdateIssue();
  const [updating, setUpdating] = useState<string | null>(null);

  const tabs: Array<{ key: Issue["status"] | "all"; label: string }> = [
    { key: "all",        label: "ทั้งหมด" },
    { key: "open",       label: "เปิดอยู่" },
    { key: "in_progress", label: "กำลังดำเนินการ" },
    { key: "resolved",   label: "แก้ไขแล้ว" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--tx-primary)" }}>รายการปัญหา</h1>
        <p className="text-xs opacity-60 mt-0.5">ติดตามและจัดการปัญหาที่พบในหอผู้ป่วย</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition-all border ${
              filter === key
                ? "bg-violet-600 text-white border-violet-600"
                : "btn-ghost border-transparent"
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="text-center py-8 opacity-50 text-sm">กำลังโหลด...</div>
        ) : issues && issues.length > 0 ? (
          issues.map((issue) => (
            <div key={issue.id} className="glass-card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle size={14} style={{ color: "var(--accent-amber)" }} className="shrink-0" />
                    <span className="font-semibold text-sm" style={{ color: "var(--tx-primary)" }}>
                      {issue.fieldLabel}
                    </span>
                    <span className={STATUS_CLASS[issue.status]}>{STATUS_LABEL[issue.status]}</span>
                  </div>
                  <p className="text-sm mt-1 opacity-80">{issue.description}</p>
                  <p className="text-xs opacity-50 mt-1">
                    รายงานโดย: {issue.reportedBy}
                    {issue.resolvedBy && ` · แก้ไขโดย: ${issue.resolvedBy}`}
                  </p>
                </div>
                {isEditor && issue.status !== "resolved" && (
                  <div className="flex gap-1 shrink-0">
                    {issue.status === "open" && (
                      <button
                        disabled={!!updating}
                        onClick={async () => {
                          setUpdating(issue.id);
                          await updateIssue.mutateAsync({ id: issue.id, data: { status: "in_progress" } });
                          setUpdating(null);
                        }}
                        className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1">
                        {updating === issue.id ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                        รับเรื่อง
                      </button>
                    )}
                    <button
                      disabled={!!updating}
                      onClick={async () => {
                        const resolvedBy = prompt("ชื่อผู้แก้ไขปัญหา:");
                        if (!resolvedBy) return;
                        setUpdating(issue.id);
                        await updateIssue.mutateAsync({ id: issue.id, data: { status: "resolved", resolvedBy } });
                        setUpdating(null);
                      }}
                      className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1 text-emerald-700">
                      {updating === issue.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      แก้ไขแล้ว
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-8 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: "var(--accent-emerald)" }} />
            <p className="font-semibold" style={{ color: "var(--tx-primary)" }}>ไม่มีปัญหาที่ต้องติดตาม</p>
            <p className="text-sm opacity-50 mt-1">ระบบปกติทุกอย่าง</p>
          </div>
        )}
      </div>
    </div>
  );
}
