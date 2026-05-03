import { Link, useLocation } from "wouter";
import { X, LayoutDashboard, Package, AlertTriangle, Settings } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useEditor } from "@/hooks/useEditor";

interface Props { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: Props) {
  const { data: categories } = useCategories();
  const { isEditor, logout } = useEditor();
  const [location] = useLocation();

  const navItem = (href: string, icon: React.ReactNode, label: string) => {
    const active = location === href;
    return (
      <Link href={href} onClick={onClose}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? "bg-violet-100/70 text-violet-800 font-semibold"
            : "hover:bg-white/40 text-slate-700"
        }`}>
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 glass-strong p-4 flex flex-col gap-2 transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      } md:hidden`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-violet-900">เมนู</span>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        {navItem("/", <LayoutDashboard size={16} />, "แดชบอร์ด")}
        {categories?.map((cat) =>
          navItem(`/category/${cat.id}`,
            <span className="w-4 h-4 rounded-full" style={{ background: cat.color }} />,
            cat.name
          )
        )}
        {navItem("/issues", <AlertTriangle size={16} />, "รายการปัญหา")}
        {navItem("/settings", <Settings size={16} />, "การตั้งค่า")}
        {isEditor && (
          <button onClick={() => { logout(); onClose(); }}
            className="mt-auto text-xs text-rose-600 hover:underline text-left px-4 py-2">
            ออกจากโหมด Editor
          </button>
        )}
      </aside>
    </>
  );
}
