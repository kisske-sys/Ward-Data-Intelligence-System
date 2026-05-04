// src/App.tsx
// Layout หลักของทั้ง App
// Desktop: Sidebar (fixed left) + Main content
// Mobile:  TopBar + Scrollable content + BottomNav + Footer

import { Route, Switch, Link, useLocation } from "wouter";
import {
  LayoutDashboard, AlertTriangle,
  Settings, ChevronRight,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import FooterBar from "@/components/FooterBar";
import BottomBar from "@/components/BottomBar";
import FloatingEditorBtn from "@/components/FloatingEditorBtn";
import HomePage from "@/pages/HomePage";
import CategoryPage from "@/pages/CategoryPage";
import FormPage from "@/pages/FormPage";
import IssuesPage from "@/pages/IssuesPage";
import SettingsPage from "@/pages/SettingsPage";

// รายการ Navigation ที่ใช้ร่วมกันทั้ง Sidebar และ BottomBar
export const NAV_ITEMS = [
  { href: "/",         Icon: LayoutDashboard, label: "หน้าหลัก",  color: "#7c3aed" },
  { href: "/issues",   Icon: AlertTriangle,   label: "แจ้งปัญหา", color: "#d97706" },
  { href: "/settings", Icon: Settings,        label: "ตั้งค่า",   color: "#0284c7" },
] as const;

export default function App() {
  return (
    <div className="app-shell">
      {/* ─── Top Bar (ทุก viewport) ─── */}
      <TopBar />

      {/* ─── Body Area (Sidebar + Content) ─── */}
      <div className="flex min-h-svh">

        {/* ─── Sidebar (desktop only เพราะ CSS ซ่อนบน mobile) ─── */}
        <DesktopSidebar />

        {/* ─── Main Content ─── */}
        <main className="main-area flex-1">
          <Switch>
            <Route path="/"              component={HomePage}     />
            <Route path="/category/:id"  component={CategoryPage} />
            <Route path="/form/:id"      component={FormPage}     />
            <Route path="/issues"        component={IssuesPage}   />
            <Route path="/settings"      component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>

      {/* ─── Mobile Bottom Nav ─── */}
      <BottomBar />

      {/* ─── Footer (ทุก viewport, อยู่ล่างสุด) ─── */}
      <FooterBar />

      {/* ─── Floating Editor Button ─── */}
      <FloatingEditorBtn />
    </div>
  );
}

// ─── Desktop Sidebar Component ───────────────────────────────
function DesktopSidebar() {
  const [location] = useLocation();

  return (
    <aside className="sidebar px-3 py-4 gap-1">
      {/* Logo section */}
      <div className="flex items-center gap-2.5 px-3 pb-4 mb-2"
        style={{ borderBottom: "1px solid var(--glass-border-soft)" }}>
        <img
          src="https://i.postimg.cc/D0dJ0MJq/SMC-LOGO-removebg-preview.png"
          alt="SMC Logo"
          className="w-8 h-8 object-contain"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight truncate"
            style={{ color: "var(--tx-primary)" }}>
            SMC Ward 15
          </p>
          <p className="text-[10px] opacity-50 leading-tight"
            style={{ color: "var(--tx-secondary)" }}>
            ชั้น 15
          </p>
        </div>
      </div>

      {/* Navigation links */}
      {NAV_ITEMS.map(({ href, Icon, label, color }) => {
        // active ถ้า path ตรงตัวหรือเป็น sub-path
        const active = href === "/"
          ? location === "/"
          : location.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-sm font-medium transition-all group
                        ${active
                          ? "bg-white/55 shadow-sm font-semibold"
                          : "hover:bg-white/35"
                        }`}
            style={{ color: active ? color : "var(--tx-secondary)" }}
          >
            {/* Active indicator dot */}
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all
                ${active ? "opacity-100" : "opacity-0"}`}
              style={{ background: color }}
            />
            <Icon
              size={17}
              strokeWidth={active ? 2.2 : 1.8}
              style={{ color: active ? color : "var(--tx-faint)" }}
            />
            <span className="flex-1">{label}</span>
            {active && (
              <ChevronRight size={14} className="opacity-40" style={{ color }} />
            )}
          </Link>
        );
      })}

      {/* Spacer ดันข้อมูลด้านล่างลงไป */}
      <div className="flex-1" />

      {/* Version info ด้านล่าง sidebar */}
      <div className="px-3 py-3 text-[10px] opacity-45 leading-relaxed"
        style={{ color: "var(--tx-secondary)" }}>
        <p className="font-semibold">SMC Excellence</p>
        <p>หอผู้ป่วยพิเศษชั้น 15</p>
        <p>Tel 66532-4</p>
      </div>
    </aside>
  );
}

// ─── 404 Page ──────────────────────────────────────────────
function NotFound() {
  return (
    <div className="page-content flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <span className="text-6xl">🏥</span>
      <p className="text-xl font-bold" style={{ color: "var(--tx-primary)" }}>
        ไม่พบหน้าที่ต้องการ
      </p>
      <Link href="/" className="btn-ghost">← กลับหน้าหลัก</Link>
    </div>
  );
}
