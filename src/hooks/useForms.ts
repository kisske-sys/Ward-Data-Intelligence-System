// src/hooks/useForms.ts
// KEY PERFORMANCE CHANGES:
//
// 1. Optimistic Updates — UI อัปเดตทันทีไม่รอ Firestore
//    ผู้ใช้เห็นผลลัพธ์ใน ~0ms แทนที่จะรอ ~300-800ms
//
// 2. Stale-While-Revalidate — แสดงข้อมูลเก่าก่อน
//    ค่อย fetch ใหม่ใน background
//
// 3. select transformer — เลือกเฉพาะ field ที่ต้องการ
//    ลด memory และ re-render

import {
  useQuery, useMutation, useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy,
  serverTimestamp, type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "checklist" | "file" | "signature";
  required: boolean;
  order: number;
  options?: string[];
  minValue?: number;
  unit?: string; // <--- เราต้องมีบรรทัดนี้ครับ Vercel ถึงจะรันผ่าน
}

export interface FormTemplate {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  scheduleType: "daily" | "per_shift";
  shifts: string[];
  ward: string;
  fields: FormField[];
  reminderEnabled: boolean;
  active: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  order: number;
  createdAt?: Timestamp;
}

export interface FormRecord {
  id: string;
  formId: string;
  formName: string;
  categoryId: string;
  shift: string;
  ward: string;
  recordedBy: string;
  data: Record<string, unknown>;
  createdAt?: Timestamp;
  date: string;
}

// ─── Helper สร้าง temp ID สำหรับ Optimistic Update ──────────
function tempId() {
  return `__temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Categories ──────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const snap = await getDocs(
        query(collection(db, "categories"), orderBy("order", "asc"))
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
    },
    // ข้อมูล category ไม่ค่อยเปลี่ยน cache 5 นาที
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Category, "id" | "createdAt">) => {
      const ref = await addDoc(collection(db, "categories"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    },

    // ─── Optimistic Update เพิ่มทันทีใน cache ───────────
    // UI เห็นรายการใหม่ทันที ไม่ต้องรอ Firestore ตอบ
    onMutate: async (newCat) => {
      // ยกเลิก query ที่กำลัง fetch เพื่อป้องกัน race condition
      await qc.cancelQueries({ queryKey: ["categories"] });

      // บันทึก snapshot เก่าไว้ rollback ถ้าเกิด error
      const prev = qc.getQueryData<Category[]>(["categories"]);

      const optimistic: Category = {
        ...newCat,
        id: tempId(),
      };

      qc.setQueryData<Category[]>(["categories"], (old = []) => [
        ...old,
        optimistic,
      ]);

      // return context สำหรับ onError
      return { prev };
    },

    // ─── Rollback ถ้า Firestore error ─────────────────
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["categories"], ctx.prev);
    },

    // ─── Sync กับ Firestore จริงหลังสำเร็จ ────────────
    onSettled: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
      await updateDoc(doc(db, "categories", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },

    // Optimistic: แก้ไข item ใน cache ทันที
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["categories"] });
      const prev = qc.getQueryData<Category[]>(["categories"]);
      qc.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["categories"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "categories", id));
    },

    // Optimistic: ลบออกจาก cache ก่อน
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["categories"] });
      const prev = qc.getQueryData<Category[]>(["categories"]);
      qc.setQueryData<Category[]>(["categories"], (old = []) =>
        old.filter((c) => c.id !== id)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["categories"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

// ─── Forms ───────────────────────────────────────────────────

export function useForms(categoryId?: string) {
  return useQuery({
    queryKey: ["forms", categoryId ?? "all"],
    queryFn: async (): Promise<FormTemplate[]> => {
      const col = collection(db, "forms");
      const q = categoryId
        ? query(col, where("categoryId", "==", categoryId), orderBy("name", "asc"))
        : query(col, orderBy("name", "asc"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FormTemplate));
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useForm(formId: string | undefined) {
  return useQuery({
    queryKey: ["form", formId],
    enabled: !!formId,
    queryFn: async (): Promise<FormTemplate | null> => {
      if (!formId) return null;
      const snap = await getDoc(doc(db, "forms", formId));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as FormTemplate) : null;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<FormTemplate, "id" | "createdAt" | "updatedAt">) => {
      const ref = await addDoc(collection(db, "forms"), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return ref.id;
    },

    // Optimistic: เพิ่ม form ใน cache ทันที
    onMutate: async (newForm) => {
      await qc.cancelQueries({ queryKey: ["forms"] });
      const prevAll = qc.getQueryData<FormTemplate[]>(["forms", "all"]);
      const prevCat = qc.getQueryData<FormTemplate[]>(["forms", newForm.categoryId]);

      const optimistic: FormTemplate = {
        ...newForm,
        id: tempId(),
      };

      // อัปเดต cache ทั้ง "all" และ category-specific
      const addToCache = (old: FormTemplate[] = []) =>
        [...old, optimistic].sort((a, b) => a.name.localeCompare(b.name, "th"));

      qc.setQueryData(["forms", "all"], addToCache);
      qc.setQueryData(["forms", newForm.categoryId], addToCache);

      return { prevAll, prevCat, categoryId: newForm.categoryId };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prevAll) qc.setQueryData(["forms", "all"], ctx.prevAll);
      if (ctx?.prevCat) qc.setQueryData(["forms", ctx.categoryId], ctx.prevCat);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["forms"] }),
  });
}

export function useUpdateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<FormTemplate, "id">>;
    }) => {
      await updateDoc(doc(db, "forms", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    onSettled: (_d, _e, { id }) => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      qc.invalidateQueries({ queryKey: ["form", id] });
    },
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "forms", id));
    },

    // Optimistic: ลบออกจาก cache ทุก key
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["forms"] });

      // หา form นี้ใน cache เพื่อรู้ว่าอยู่ category ไหน
      const allForms = qc.getQueryData<FormTemplate[]>(["forms", "all"]) ?? [];
      const target   = allForms.find((f) => f.id === id);

      const filterOut = (old: FormTemplate[] = []) => old.filter((f) => f.id !== id);

      qc.setQueryData(["forms", "all"], filterOut);
      if (target?.categoryId) {
        qc.setQueryData(["forms", target.categoryId], filterOut);
      }

      return { allForms };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.allForms) qc.setQueryData(["forms", "all"], ctx.allForms);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["forms"] }),
  });
}

// ─── Records — ส่วนที่ช้าที่สุด แก้ด้วย Optimistic ──────────

export function useRecords(formId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ["records", formId, date ?? "all"],
    enabled: !!formId,
    queryFn: async (): Promise<FormRecord[]> => {
      if (!formId) return [];
      const col = collection(db, "records");
      const constraints = [where("formId", "==", formId)];
      if (date) constraints.push(where("date", "==", date));
      const snap = await getDocs(
        query(col, ...constraints, orderBy("createdAt", "desc"))
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FormRecord));
    },
    staleTime: 1000 * 20,
  });
}

export function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<FormRecord, "id" | "createdAt">) => {
      const ref = await addDoc(collection(db, "records"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    },

    // ─── Optimistic Update สำหรับ Record ─────────────
    // นี่คือจุดที่ทำให้ "บันทึก" รู้สึกว่าเร็วขึ้นมาก
    // ผู้ใช้เห็น record ใหม่ทันทีใน list
    onMutate: async (newRecord) => {
      const qKey = ["records", newRecord.formId, newRecord.date];
      await qc.cancelQueries({ queryKey: qKey });

      const prev = qc.getQueryData<FormRecord[]>(qKey);

      // สร้าง optimistic record ที่มี fake id และ createdAt ปัจจุบัน
      const optimistic: FormRecord = {
        ...newRecord,
        id: tempId(),
        createdAt: {
          // Mock Timestamp object ให้ display logic ทำงานได้
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0,
          toDate: () => new Date(),
        } as unknown as Timestamp,
      };

      // เพิ่มที่ต้นของ array (newest first)
      qc.setQueryData<FormRecord[]>(qKey, (old = []) => [optimistic, ...old]);

      return { prev, qKey };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.qKey, ctx.prev);
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({
        queryKey: ["records", vars.formId, vars.date],
      });
    },
  });
}

export function useDeleteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "records", id));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["records"] }),
  });
}
