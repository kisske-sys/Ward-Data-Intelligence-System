// src/components/FooterBar.tsx
// แถบ footer แสดงข้อมูลหน่วยงาน — ปรากฏทุก viewport
// fixed bottom-0 ซ้อนบน BottomBar บน mobile → ดังนั้น BottomBar จึงต้องอยู่เหนือ footer

export default function FooterBar() {
  return (
    <footer
      className="glass fixed bottom-0 left-0 right-0 z-30"
      style={{ borderTop: "1px solid rgba(255,255,255,0.45)" }}
    >
      <div
        className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-3
                   px-4 py-1.5 text-center"
      >
        {/* ชื่อระบบ */}
        <span
          className="text-xs font-bold tracking-wide"
          style={{ color: "var(--accent-violet)" }}
        >
          SMC Excellence Data Center
        </span>

        {/* divider — ซ่อนบน mobile เพราะ flex-col */}
        <span className="hidden sm:inline text-violet-300 select-none">|</span>

        {/* ชื่อหน่วยงาน */}
        <span className="text-xs font-medium" style={{ color: "var(--tx-secondary)" }}>
          พัฒนาโดย&nbsp;
          <span className="font-semibold">หอผู้ป่วยพิเศษชั้น 15</span>
        </span>

        <span className="hidden sm:inline text-violet-300 select-none">|</span>

        {/* เบอร์โทร */}
        <a
          href="tel:+6666532-4"
          className="text-xs font-medium transition-colors hover:underline"
          style={{ color: "var(--tx-muted)" }}
        >
          ☎ Tel 66532-4
        </a>
      </div>
    </footer>
  );
}
