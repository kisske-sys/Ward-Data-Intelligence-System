import { Menu, Bell } from "lucide-react";
import { useClock } from "@/hooks/useClock";
import { useIssues } from "@/hooks/useIssues";

interface Props { onMenuClick: () => void; }

export default function TopBar({ onMenuClick }: Props) {
  const { timeStr, dateStr } = useClock();
  const { data: openIssues } = useIssues("open");
  const issueCount = openIssues?.length ?? 0;

  return (
    <header className="glass sticky top-0 z-50 px-4 py-3 flex items-center gap-3">
      <button onClick={onMenuClick} className="btn-ghost p-2 md:hidden">
        <Menu size={20} />
      </button>
      <img
        src="https://i.postimg.cc/D0dJ0MJq/SMC-LOGO-removebg-preview.png"
        alt="SMC Logo"
        className="h-9 w-auto"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "var(--tx-primary)" }}>
          SMC Ward 15
        </p>
        <p className="text-xs opacity-60 truncate hidden sm:block" style={{ color: "var(--tx-secondary)" }}>
          หอผู้ป่วยพิเศษชั้น 15
        </p>
      </div>
      <div className="hidden md:flex flex-col items-end">
        <span className="text-xs font-mono font-semibold tabular-nums" style={{ color: "var(--accent-violet)" }}>
          {timeStr}
        </span>
        <span className="text-xs opacity-60" style={{ color: "var(--tx-primary)" }}>{dateStr}</span>
      </div>
      <div className="relative">
        <Bell size={20} style={{ color: "var(--tx-secondary)" }} />
        {issueCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {issueCount > 9 ? "9+" : issueCount}
          </span>
        )}
      </div>
    </header>
  );
}
