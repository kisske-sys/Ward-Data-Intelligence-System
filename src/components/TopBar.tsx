// src/components/TopBar.tsx
// บน desktop: logo + title อยู่ซ้าย, badge + action อยู่ขวา
// บน mobile: เหมือนกันแต่ padding แคบลง

import { useEditor } from "@/hooks/useEditor";
import { Shield, Activity } from "lucide-react";

export default function TopBar() {
  const { isEditor } = useEditor();

  return (
    <header className="topbar">
      {/* Logo */}
      <img
        src="https://i.postimg.cc/D0dJ0MJq/SMC-LOGO-removebg-preview.png"
        alt="SMC Logo"
        className="w-9 h-9 object-contain shrink-0 drop-shadow-sm"
      />

      {/* Title — flex-1 ทำให้ยืดไปชิดปุ่มขวา */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-bold leading-tight truncate"
          style={{ color: "var(--tx-primary)" }}>
          SMC Ward 15
        </h1>
        {/* ซ่อนคำอธิบายบนจอเล็กมาก เพื่อไม่ให้ topbar สูงขึ้น */}
        <p className="hidden xs:block text-[10px] opacity-55 leading-tight truncate"
          style={{ color: "var(--tx-secondary)" }}>
          ระบบบันทึกข้อมูลหอผู้ป่วยพิเศษชั้น 15
        </p>
      </div>

      {/* Status indicator — แสดงว่า app connected */}
      <div className="flex items-center gap-1.5">
        <Activity size={12} className="text-emerald-500 animate-pulse" />
        <span className="hidden sm:inline text-xs font-medium text-emerald-600">
          Online
        </span>
      </div>

      {/* Editor badge — แสดงเฉพาะเมื่อ login แล้ว */}
      {isEditor && (
        <span className="badge badge-violet flex items-center gap-1 shrink-0">
          <Shield size={10} />
          <span className="hidden xs:inline">Editor</span>
        </span>
      )}
    </header>
  );
}
