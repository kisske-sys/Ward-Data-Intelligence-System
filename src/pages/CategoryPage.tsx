// src/pages/CategoryPage.tsx
import { useRoute, Link } from "wouter";
import { ArrowLeft, FileText, ChevronRight, Loader2, Plus } from "lucide-react";
import { useCategories, useForms } from "@/hooks/useForms";
import { useEditor } from "@/hooks/useEditor";
import { useState } from "react";
import FormBuilderModal from "@/components/FormBuilderModal";

export default function CategoryPage() {
  const [, params] = useRoute("/category/:id");
  const catId = params?.id ?? "";
  const { isEditor } = useEditor();

  const { data: categories = [] } = useCategories();
  const { data: forms = [], isLoading } = useForms(catId);
  const [showModal, setShowModal] = useState(false);

  const cat = categories.find((c) => c.id === catId);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-2xl">{cat?.icon ?? "📋"}</span>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base" style={{ color: "var(--tx-primary)" }}>
            {cat?.name ?? "หมวดหมู่"}
          </h2>
          <p className="text-xs opacity-55" style={{ color: "var(--tx-secondary)" }}>
            {forms.length} แบบบันทึก
          </p>
        </div>
        {isEditor && (
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
            <Plus size={15} /> เพิ่มแบบบันทึก
          </button>
        )}
      </div>

      {/* Form List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-violet-500" />
        </div>
      ) : forms.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <FileText size={40} className="mx-auto mb-3 opacity-25"
            style={{ color: "var(--accent-violet)" }} />
          <p className="font-medium" style={{ color: "var(--tx-primary)" }}>
            ยังไม่มีแบบบันทึก
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {forms.map((form) => (
            <Link
              key={form.id}
              href={`/form/${form.id}`}
              className="glass rounded-2xl px-4 py-4 flex items-center gap-3
                         hover:bg-white/45 transition-colors"
            >
              <FileText size={20} className="shrink-0 opacity-60"
                style={{ color: cat?.color ?? "var(--accent-violet)" }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--tx-primary)" }}>
                  {form.name}
                </p>
                {form.description && (
                  <p className="text-xs opacity-55 truncate" style={{ color: "var(--tx-secondary)" }}>
                    {form.description}
                  </p>
                )}
              </div>
              <span className="badge badge-violet text-[10px] shrink-0">
                {form.scheduleType === "per_shift" ? "ต่อเวร" : "รายวัน"}
              </span>
              <ChevronRight size={16} className="opacity-35 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <FormBuilderModal categoryId={catId} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
