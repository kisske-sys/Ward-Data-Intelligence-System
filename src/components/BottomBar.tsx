import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, AlertTriangle, Settings } from "lucide-react";

const NAV = [
  { href: "/",         icon: <LayoutDashboard size={20} />, label: "หน้าหลัก"  },
  { href: "/issues",   icon: <AlertTriangle size={20} />,   label: "ปัญหา"     },
  { href: "/settings", icon: <Settings size={20} />,        label: "ตั้งค่า"   },
];

export default function BottomBar() {
  const [location] = useLocation();
  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 md:hidden">
      {NAV.map(({ href, icon, label }) => {
        const active = location === href;
        return (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-xs transition-all ${
              active ? "text-violet-700 font-semibold" : "text-slate-500"
            }`}>
            {icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
