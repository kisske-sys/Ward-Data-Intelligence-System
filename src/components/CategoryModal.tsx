// src/components/CategoryModal.tsx
// Modal นี้จำเป็นมาก — ถ้าไม่มีไฟล์นี้ ปุ่ม "เพิ่มหมวดหมู่" จะ error ทันที

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  useCreateCategory, useUpdateCategory,
  type Category,
} from "@/hooks/useForms";

interface Props {
  category?: Category; // ถ้ามีค่า = edit mode, ถ้าไม่มี = create mode
  onClose: () => void;
}

// Emoji icon ที่ใช้บ่อยในโรงพยาบาล
const ICON_OPTS = [
  "🏥","💊","🩺","🩻","🫀","🧬","💉","🩹",
  "📋","📊","🔬","⚕️","🛏️","🚑","🧪","📌",
];

// สี Pastel สำหรับ Category
const COLOR_OPTS = [
  { hex: "#7c3aed", label: "ม่วง"  },
  { hex: "#2563eb", label: "น้ำเงิน"},
  { hex: "#059669", label: "เขียว"  },
  { hex: "#d97706", label: "ส้ม"    },
  { hex: "#e11d48", label: "แดง"    },
  { hex: "#0891b2", label: "ฟ้า"    },
  { hex: "#7c2d12", label: "น้ำตาล" },
  { hex: "#4f46e5", label: "คราม"   },
];

export default function CategoryModal({ category, onClose }: Props) {
  const createCat  = useCreateCategory();
  const updateCat  = useUpdateCategory();
  const isEdit     = !!category;

  const [name,        setName]        = useState(category?.name        ?? "");
  const [icon,        setIcon]        = useState(category?.icon        ?? "📋");
  const [color,       setColor]       = useState(category?.color       ?? "#7c3aed");
  const [description, setDescription] = useState(category?.description ?? "");
  const [loading,     setLoading]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert("กรุณาใส่ชื่อหมวดหมู่"); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await updateCat.mutateAsync({
          id: category.id,
          data: { name, icon, color, description },
        });
      } else {
        await createCat.mutateAsync({
          name, icon, color, description,
          order: Date.now(), // ใช้ timestamp เป็น order เพื่อให้ใหม่อยู่ท้าย
        });
      }
      onClose();
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30">
      <div className="glass-strong rounded-2xl w-full max-w-md animate-in">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/30">
          <h2 className="font-bold text-base" style={{ color: "var(--tx-primary)" }}>
            {isEdit ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">

          {/* Preview */}
          <div
            className="glass-card rounded-xl p-3 flex items-center gap-3"
            style={{ borderLeft: `4px solid ${color}` }}
          >
            <span className="text-3xl">{icon}</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--tx-primary)" }}>
                {name || "ชื่อหมวดหมู่"}
              </p>
              <p className="text-xs opacity-50" style={{ color: "var(--tx-secondary)" }}>
                {description || "คำอธิบาย"}
              </p>
            </div>
          </div>

          {/* ชื่อ */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>
              ชื่อหมวดหมู่ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น เครื่องมือแพทย์, ยาและเวชภัณฑ์"
              className="input-glass"
              autoFocus
            />
          </div>

          {/* คำอธิบาย */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--tx-primary)" }}>
              คำอธิบาย (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายสั้นๆ เกี่ยวกับหมวดหมู่นี้"
              className="input-glass"
            />
          </div>

          {/* เลือก Icon */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--tx-primary)" }}>
              ไอคอน
            </label>
            <div className="grid grid-cols-8 gap-1.5">
              {ICON_OPTS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-xl py-1.5 rounded-lg transition-all
                    ${icon === emoji
                      ? "bg-violet-100 ring-2 ring-violet-400 scale-110"
                      : "bg-white/40 hover:bg-white/70"
                    }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* เลือก สี */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--tx-primary)" }}>
              สี
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTS.map(({ hex, label }) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  title={label}
                  className={`w-8 h-8 rounded-full transition-all border-2
                    ${color === hex ? "scale-125 border-white shadow-lg" : "border-transparent"}`}
                  style={{ background: hex }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? "บันทึก" : "เพิ่มหมวดหมู่"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
