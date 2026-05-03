import { useParams, Link } from "wouter";
import { Plus, Edit2, Trash2, ChevronRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useCategories, useDeleteCategory, useUpdateCategory } from "@/hooks/useCategories";
import { useForms, useDeleteForm } from "@/hooks/useForms";
import { useEditor } from "@/hooks/useEditor";
import FormBuilderModal from "@/components/FormBuilderModal";

export default function CategoryPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params.id;
  const { data: categories } = useCategories();
  const { data: forms } = useForms(categoryId);
  const { isEditor } = useEditor();
  const deleteCategory = useDeleteCategory();
  const deleteForm = useDeleteForm();

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<string | undefined>();
  const [editingCatName, setEditingCatName] = useState(false);
  const [catName, setCatName] = useState("");
  const updateCategory = useUpdateCategory();

  const category = categories?.find((c) => c.id === categoryId);
  if (!category) return (
    <div className="glass-card p-8 text-center mt-8">
      <p className="opacity-50" style={{ color: "var(--tx-primary)" }}>ไม่พบหมวดหมู่นี้</p>
    </div>
  );

  const editingFormObj = forms?.find((f) => f.id === editingForm);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/">
          <button className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
            style={{ background: category.color + "22", color: category.color }}>
            <span className="text-lg">●</span>
          </div>
          {editingCatName ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              await updateCategory.mutateAsync({ id: categoryId, data: { name: catName } });
              setEditingCatName(false);
            }} className="flex items-center gap-2 flex-1">
              <input value={catName} onChange={(e) => setCatName(e.target.value)}
                className="input-glass flex-1" autoFocus />
              <button type="submit" className="btn-primary text-sm px-3 py-1.5">บันทึก</button>
              <button type="button" onClick={() => setEditingCatName(false)} className="btn-ghost text-sm px-3 py-1.5">ยกเลิก</button>
            </form>
          ) : (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg truncate" style={{ color: "var(--tx-primary)" }}>{category.name}</h1>
              <p className="text-xs opacity-50">{forms?.length ?? 0} แบบบันทึก</p>
            </div>
          )}
          {isEditor && !editingCatName && (
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setCatName(category.name); setEditingCatName(true); }}
                className="btn-ghost p-2"><Edit2 size={14} /></button>
              <button onClick={async () => {
                if (confirm(`ลบหมวดหมู่ "${category.name}" และแบบบันทึกทั้งหมด?`)) {
                  await deleteCategory.mutateAsync(categoryId);
                  window.location.href = "/";
                }
              }} className="btn-ghost p-2 text-rose-400"><Trash2 size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {isEditor && (
        <button onClick={() => { setEditingForm(undefined); setShowBuilder(true); }}
          className="btn-primary flex items-center gap-2 self-start">
          <Plus size={16} /> สร้างแบบบันทึกใหม่
        </button>
      )}

      <div className="flex flex-col gap-3">
        {forms?.map((form) => (
          <div key={form.id} className="glass-card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: "var(--tx-primary)" }}>{form.name}</p>
              {form.description && (
                <p className="text-xs opacity-60 mt-0.5 truncate">{form.description}</p>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="badge-info">{form.scheduleType === "per_shift" ? "ต่อเวร" : "รายวัน"}</span>
                {form.shifts.map((s) => (
                  <span key={s} className="badge-ok">{s === "morning" ? "เช้า" : s === "afternoon" ? "บ่าย" : "ดึก"}</span>
                ))}
                <span className="text-xs opacity-50">{form.fields.length} ช่องข้อมูล</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {isEditor && (
                <>
                  <button onClick={() => { setEditingForm(form.id); setShowBuilder(true); }}
                    className="btn-ghost p-2"><Edit2 size={14} /></button>
                  <button onClick={async () => {
                    if (confirm(`ลบแบบบันทึก "${form.name}"?`))
                      await deleteForm.mutateAsync(form.id);
                  }} className="btn-ghost p-2 text-rose-400"><Trash2 size={14} /></button>
                </>
              )}
              <Link href={`/form/${form.id}`}>
                <button className="btn-ghost p-2"><ChevronRight size={14} /></button>
              </Link>
            </div>
          </div>
        ))}
        {forms?.length === 0 && (
          <div className="glass-card p-8 text-center opacity-50 text-sm" style={{ color: "var(--tx-primary)" }}>
            {isEditor ? 'กด "สร้างแบบบันทึกใหม่" เพื่อเริ่ม' : "ยังไม่มีแบบบันทึกในหมวดนี้"}
          </div>
        )}
      </div>

      {showBuilder && (
        <FormBuilderModal
          categoryId={categoryId}
          form={editingFormObj}
          onClose={() => { setShowBuilder(false); setEditingForm(undefined); }}
        />
      )}
    </div>
  );
}
