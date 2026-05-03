import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, serverTimestamp, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "checklist" | "file" | "signature";
  required?: boolean;
  order: number;
  unit?: string;
  minValue?: number;
  options?: string[];
  hasIssueFlag?: boolean;
}

export interface FormTemplate {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  fields: FormField[];
  scheduleType: "daily" | "per_shift";
  shifts: string[];
  reminderEnabled: boolean;
  ward: string;
  active: boolean;
}

const COL = "forms";

export function useForms(categoryId?: string) {
  return useQuery({
    queryKey: ["forms", categoryId ?? "all"],
    queryFn: async () => {
      const q = categoryId
        ? query(collection(db, COL), where("categoryId", "==", categoryId), orderBy("name"))
        : query(collection(db, COL), orderBy("name"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FormTemplate);
    },
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<FormTemplate, "id">) => {
      await addDoc(collection(db, COL), { ...data, active: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      qc.invalidateQueries({ queryKey: ["forms", v.categoryId] });
    },
  });
}

export function useUpdateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<FormTemplate, "id">> }) => {
      await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms"] }),
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await deleteDoc(doc(db, COL, id)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms"] }),
  });
}
