import { Link } from "wouter";
import { ClipboardList, AlertTriangle, CheckCircle2, TrendingUp, ChevronRight, Plus } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useForms } from "@/hooks/useForms";
import { useRecentRecords } from "@/hooks/useRecords";
import { useIssues } from "@/hooks/useIssues";
import { useClock } from "@/hooks/useClock";

export default function Dashboard() {
  const { timeStr, dateStr, todayKey } = useClock();
  const { data: categories } = useCategories();
  const { data: allForms } = useForms();
  const { data: recentRecords } = useRecentRecords(50);
  const { data: openIssues } = useIssues("open");

  const todayRecords = recentRecords?.filter((r) => r.recordDate === todayKey) ?? [];
  const issueCount = openIssues?.length ?? 0;
  const lowStockCount = todayRecords.filter((r) => r.hasLowStock).length;
  const formsCount = allForms?.length ?? 0;

  const STAT_CARDS = [
    { label: "บันทึกวันนี้",   value: todayRecords.length, icon: <ClipboardList size={20} />, color: "#7c3aed", bg: "rgba(124,58,237,0.1)"  },
    { label: "ปัญหาที่เปิดอยู่", value: issueCount,           icon: <AlertTriangle size={20} />,  color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
    { label: "แจ้งเตือนของต่ำ",  value: lowStockCount,         icon: <TrendingUp size={20} />,    color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
    { label: "แบบบันทึกทั้งหมด", value: formsCount,            icon: <CheckCircle2 size={20} />,  color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-card p-5">
        <p className="text-xs opacity-60" style={{ color: "var(--tx-primary)" }}>{dateStr}</p>
        <p className="text-3xl font-bold font-mono tabular-nums mt-1" style={{ color: "var(--accent-violet)" }}>
          {timeStr}
        </p>
        <p className="text-sm font-medium mt-1 opacity-70" style={{ color: "var(--tx-primary)" }}>
          หอผู้ป่วยพิเศษชั้น 15 · Santiram Medical Center
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_CARDS.map(({ label, value, icon, color, bg }) => (
          <div key={label} className="glass-card p-4 flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
              {icon}
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
            <p className="text-xs opacity-70 leading-tight" style={{ color: "var(--tx-primary)" }}>{label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-bold mb-3 px-1" style={{ color: "var(--tx-primary)" }}>หมวดหมู่</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories?.map((cat) => {
            const catForms = allForms?.filter((f) => f.categoryId === cat.id) ?? [];
            const catRecords = todayRecords.filter((r) =>
              catForms.some((f) => f.id === r.formId)
            );
            return (
              <Link key={cat.id} href={`/category/${cat.id}`}>
                <div className="glass-card p-4 flex items-center gap-4 cursor-pointer">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: cat.color + "22", color: cat.color }}>
                    <span className="text-lg">●</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--tx-primary)" }}>{cat.name}</p>
                    <p className="text-xs opacity-60 mt-0.5" style={{ color: "var(--tx-primary)" }}>
                      {catForms.length} แบบบันทึก · {catRecords.length} รายการวันนี้
                    </p>
                  </div>
                  <ChevronRight size={16} className="opacity-40 shrink-0" />
                </div>
              </Link>
            );
          })}
          {(!categories || categories.length === 0) && (
            <div className="col-span-2 glass-card p-8 text-center opacity-50 text-sm" style={{ color: "var(--tx-primary)" }}>
              ยังไม่มีหมวดหมู่ — เข้าโหมด Editor เพื่อเริ่มตั้งค่าระบบ
            </div>
          )}
        </div>
      </div>

      {recentRecords && recentRecords.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3 px-1" style={{ color: "var(--tx-primary)" }}>บันทึกล่าสุด</h2>
          <div className="flex flex-col gap-2">
            {recentRecords.slice(0, 5).map((rec) => {
              const form = allForms?.find((f) => f.id === rec.formId);
              return (
                <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${rec.hasIssues || rec.hasLowStock ? "bg-amber-400" : "bg-emerald-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--tx-primary)" }}>
                      {form?.name ?? rec.formId}
                    </p>
                    <p className="text-xs opacity-50" style={{ color: "var(--tx-primary)" }}>
                      {rec.recordedBy} · {rec.recordDate} {rec.shift && `(${rec.shift})`}
                    </p>
                  </div>
                  {rec.hasLowStock && <span className="badge-warn">ต่ำ</span>}
                  {rec.hasIssues && <span className="badge-error">ปัญหา</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
