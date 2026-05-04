// src/hooks/useForms.ts
// ทุก mutation (create/update/delete) ใช้ React Query
// เพื่อให้ข้อมูลบน UI sync กับ Firestore แบบ real-time

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ───────────────────────────────────────────
export interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "checklist" | "file" | "signature";
  required: boolean;
  order: number;
  options?: string[];   // สำหรับ select / checklist
  minValue?: number;    // สำหรับ number — ถ้าต่ำกว่านี้ให้แจ้งเตือน
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
  date: string; // "YYYY-MM-DD"
}

// ─── Categories ──────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const snap = await getDocs(
        query(collection(db, "categories"), orderBy("order", "asc"))
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
    },
    staleTime: 1000 * 60, // cache 1 นาที
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
    // invalidate cache ทันทีเพื่อให้ UI refresh
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "categories", id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

// ─── Forms ───────────────────────────────────────────

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
    staleTime: 1000 * 30,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms"] }),
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
    onSuccess: (_d, { id }) => {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms"] }),
  });
}

// ─── Records ─────────────────────────────────────────

export function useRecords(formId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ["records", formId, date ?? "all"],
    enabled: !!formId,
    queryFn: async (): Promise<FormRecord[]> => {
      if (!formId) return [];
      const col = collection(db, "records");
      const constraints = [where("formId", "==", formId)];
      if (date) constraints.push(where("date", "==", date));
      const snap = await getDocs(query(col, ...constraints, orderBy("createdAt", "desc")));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FormRecord));
    },
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["records"] }),
  });
}

export function useDeleteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "records", id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["records"] }),
  });
}
