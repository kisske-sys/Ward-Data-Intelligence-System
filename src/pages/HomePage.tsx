// src/pages/HomePage.tsx
import { useState } from "react";
import { Link } from "wouter";
import {
  Plus, Pencil, Trash2, Loader2,
  ChevronRight, FolderOpen, FileText,
} from "lucide-react";
import { useEditor } from "@/hooks/useEditor";
import {
  useCategories, useCreateCategory,
  useUpdateCategory, useDeleteCategory,
  useForms, useDeleteForm,
  type Category,
} from "@/hooks/useForms";
import FormBuilderModal from "@/components/FormBuilderModal";
import CategoryModal from "@/components/CategoryModal";

export default function HomePage() {
  const { isEditor } = useEditor();
  const { data: categories = [], isLoading } = useCategories();

  // state สำหรับ Modal ต่างๆ
  const [catModal, setCatModal]   = useState<{ open: boolean; cat?: Category }>({ open: false });
  const [formModal, setFormModal] = useState<{ open: boolean; categoryId?: string }>({ open: false });

  const deleteCategory = useDeleteCategory();
  const deleteForm     = useDeleteForm();

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`ลบหมวดหมู่ "${name}" และแบบบันทึกทั้งหมดในนั้น?`)) return;
    await deleteCategory.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={28} className="animate-spin text-violet-500" />
        <span style={{ color: "var(--tx-muted)" }}>กำลังโหลดข้อมูล…</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 animate-in">

      {/* ─── Header Row ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--tx-primary)" }}>
            หมวดหมู่แบบบันทึก
          </h2>
          <p className="text-xs opacity-60" style={{ color: "var(--tx-secondary)" }}>
            {categories.length} หมวดหมู่
          </p>
        </div>
        {/* ปุ่มเพิ่มหมวดหมู่ — แสดงเฉพาะ Editor */}
        {isEditor && (
          <button
            onClick={() => setCatModal({ open: true })}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Plus size={16} />
            เพิ่มหมวดหมู่
          </button>
        )}
      </div>

      {/* ─── Category List ───────────────────────────── */}
      {categories.length === 0 ? (
        <EmptyState
          isEditor={isEditor}
          onAdd={() => setCatModal({ open: true })}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isEditor={isEditor}
              onEditCat={() => setCatModal({ open: true, cat })}
              onDeleteCat={() => handleDeleteCategory(cat.id, cat.name)}
              onAddForm={() => setFormModal({ open: true, categoryId: cat.id })}
              onDeleteForm={(fid) => {
                if (confirm("ลบแบบบันทึกนี้?")) deleteForm.mutateAsync(fid);
              }}
            />
          ))}
        </div>
      )}

      {/* ─── Modals ──────────────────────────────────── */}
      {catModal.open && (
        <CategoryModal
          category={catModal.cat}
          onClose={() => setCatModal({ open: false })}
        />
      )}
      {formModal.open && formModal.categoryId && (
        <FormBuilderModal
          categoryId={formModal.categoryId}
          onClose={() => setFormModal({ open: false })}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────

function EmptyState({
  isEditor,
  onAdd,
}: {
  isEditor: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="glass-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
      <FolderOpen size={52} className="opacity-25" style={{ color: "var(--accent-violet)" }} />
      <p className="font-semibold text-base" style={{ color: "var(--tx-primary)" }}>
        ยังไม่มีหมวดหมู่
      </p>
      <p className="text-sm opacity-60" style={{ color: "var(--tx-secondary)" }}>
        {isEditor
          ? "กด «เพิ่มหมวดหมู่» เพื่อเริ่มสร้างระบบบันทึกข้อมูล"
          : "รอ Admin เพิ่มข้อมูลเข้าระบบ"}
      </p>
      {isEditor && (
        <button onClick={onAdd} className="btn-primary">
          <Plus size={16} /> เพิ่มหมวดหมู่แรก
        </button>
      )}
    </div>
  );
}

function CategoryCard({
  category,
  isEditor,
  onEditCat,
  onDeleteCat,
  onAddForm,
  onDeleteForm,
}: {
  category: Category;
  isEditor: boolean;
  onEditCat: () => void;
  onDeleteCat: () => void;
  onAddForm: () => void;
  onDeleteForm: (id: string) => void;
}) {
  const { data: forms = [] } = useForms(category.id);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Category Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: `linear-gradient(90deg, ${category.color}22 0%, transparent 100%)`,
          borderBottom: "1px solid rgba(255,255,255,0.35)",
        }}
      >
        <span className="text-2xl">{category.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: "var(--tx-primary)" }}>
            {category.name}
          </p>
          {category.description && (
            <p className="text-xs opacity-55 truncate" style={{ color: "var(--tx-secondary)" }}>
              {category.description}
            </p>
          )}
        </div>
        <span className="badge badge-violet text-[10px]">{forms.length} แบบบันทึก</span>

        {/* Editor actions */}
        {isEditor && (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={onEditCat}
              className="btn-ghost p-1.5 text-xs"
              title="แก้ไขหมวดหมู่"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDeleteCat}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600
                         hover:bg-rose-50/60 transition-colors"
              title="ลบหมวดหมู่"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Form List inside Category */}
      <div className="p-3 flex flex-col gap-2">
        {forms.length === 0 ? (
          <p className="text-xs text-center py-3 opacity-40" style={{ color: "var(--tx-primary)" }}>
            ยังไม่มีแบบบันทึกในหมวดนี้
          </p>
        ) : (
          forms.map((form) => (
            <div
              key={form.id}
              className="glass-card rounded-xl flex items-center gap-2 px-3 py-2"
            >
              <FileText size={14} className="shrink-0 opacity-50" style={{ color: category.color }} />
              <Link
                href={`/form/${form.id}`}
                className="flex-1 min-w-0 text-sm font-medium truncate hover:underline"
                style={{ color: "var(--tx-primary)" }}
              >
                {form.name}
              </Link>
              <span className="badge badge-sky text-[10px] shrink-0">
                {form.scheduleType === "per_shift" ? "ต่อเวร" : "รายวัน"}
              </span>
              {isEditor && (
                <button
                  onClick={() => onDeleteForm(form.id)}
                  className="text-rose-400 hover:text-rose-600 shrink-0 p-0.5"
                >
                  <Trash2 size={12} />
                </button>
              )}
              <Link href={`/form/${form.id}`} className="shrink-0">
                <ChevronRight size={16} className="opacity-40" />
              </Link>
            </div>
          ))
        )}

        {/* ปุ่มเพิ่มแบบบันทึกใหม่ใน Category นี้ */}
        {isEditor && (
          <button
            onClick={onAddForm}
            className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800
                       font-medium py-1.5 px-2 rounded-lg hover:bg-violet-50/50 transition-colors"
          >
            <Plus size={14} />
            เพิ่มแบบบันทึก
          </button>
        )}
      </div>
    </div>
  );
}
