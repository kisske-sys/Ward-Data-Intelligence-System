// src/components/FooterBar.tsx
// z-index: 25 (CSS) — อยู่ต่ำกว่า BottomBar (z-40) จึงไม่ทับกัน
// BottomBar ถูก offset ขึ้นมาด้วย bottom: calc(footer-h + 4px)

export default function FooterBar() {
  return (
    <footer className="footer-bar">
      {/* แสดงแบบ responsive:
          mobile: stack กัน  →  desktop: เรียงแถวเดียว */}
      <div className="flex flex-col sm:flex-row items-center
                      justify-center gap-0.5 sm:gap-3 w-full text-center">

        <span className="text-[11px] font-bold tracking-wide"
          style={{ color: "var(--accent-violet)" }}>
          SMC Excellence Data Center
        </span>

        <span className="hidden sm:inline select-none opacity-30"
          style={{ color: "var(--tx-primary)" }}>
          |
        </span>

        <span className="text-[11px] font-medium" style={{ color: "var(--tx-secondary)" }}>
          พัฒนาโดย&nbsp;
          <strong>หอผู้ป่วยพิเศษชั้น 15</strong>
        </span>

        <span className="hidden sm:inline select-none opacity-30"
          style={{ color: "var(--tx-primary)" }}>
          |
        </span>

        <a
          href="tel:66532-4"
          className="text-[11px] font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--tx-muted)" }}
        >
          ☎&nbsp;Tel 66532-4
        </a>
      </div>
    </footer>
  );
}
