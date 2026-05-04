// src/components/TopBar.tsx
import { useEditor } from "@/hooks/useEditor";
import { Shield } from "lucide-react";

export default function TopBar() {
  const { isEditor } = useEditor();

  return (
    <header className="glass sticky top-0 z-50 flex items-center gap-3 px-4 py-3">
      {/* Logo */}
      <img
        src="https://i.postimg.cc/D0dJ0MJq/SMC-LOGO-removebg-preview.png"
        alt="SMC Logo"
        className="w-9 h-9 object-contain drop-shadow"
      />

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1
          className="text-sm font-bold leading-tight truncate"
          style={{ color: "var(--tx-primary)" }}
        >
          SMC Ward 15
        </h1>
        <p className="text-[10px] leading-tight opacity-60" style={{ color: "var(--tx-secondary)" }}>
          ระบบบันทึกข้อมูลหอผู้ป่วยพิเศษชั้น 15
        </p>
      </div>

      {/* Editor badge */}
      {isEditor && (
        <span className="badge badge-violet flex items-center gap-1">
          <Shield size={10} />
          Editor
        </span>
      )}
    </header>
  );
}
