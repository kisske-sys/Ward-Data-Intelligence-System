// src/components/BottomBar.tsx
// z-40 > z-30 (FooterBar) → BottomBar จะลอยเหนือ FooterBar บน mobile
// bottom-6 ทำให้ BottomBar อยู่เหนือ FooterBar (~24px)

import { Link, useLocation } from "wouter";
import { LayoutDashboard, AlertTriangle, Settings } from "lucide-react";

const NAV = [
  { href: "/",         icon: LayoutDashboard, label: "หน้าหลัก" },
  { href: "/issues",   icon: AlertTriangle,   label: "ปัญหา"    },
  { href: "/settings", icon: Settings,        label: "ตั้งค่า"  },
];

export default function BottomBar() {
  const [location] = useLocation();

  return (
    <nav
      className="glass fixed left-3 right-3 z-40 flex items-center
                 justify-around px-2 py-2 rounded-2xl md:hidden"
      // bottom: 30px ให้ FooterBar (~28px) โผล่ข้างล่าง
      style={{ bottom: "30px" }}
    >
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = location === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl text-xs
                        font-medium transition-all
                        ${active
                          ? "text-violet-700 bg-violet-100/60 font-semibold"
                          : "text-slate-500 hover:text-violet-600"
                        }`}
          >
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
