// src/components/BottomBar.tsx
// ใช้ class "bottom-nav" ที่ define ใน CSS แล้ว
// CSS จัดการ position, z-index, และ bottom offset ให้หมด
// ที่นี่จึงมีแค่ content เท่านั้น

import { Link, useLocation } from "wouter";
import { NAV_ITEMS } from "@/App";

export default function BottomBar() {
  const [location] = useLocation();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, Icon, label, color }) => {
        const active = href === "/" ? location === "/" : location.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 
                        rounded-xl text-xs transition-all min-w-[64px]
                        ${active ? "font-semibold" : "opacity-55 hover:opacity-80"}`}
            style={{ color: active ? color : "var(--tx-secondary)" }}
          >
            {/* Active indicator — dot ที่ด้านบนของ icon */}
            <span className="relative">
              {active && (
                <span
                  className="absolute -top-1 left-1/2 -translate-x-1/2
                             w-1 h-1 rounded-full"
                  style={{ background: color }}
                />
              )}
              <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
