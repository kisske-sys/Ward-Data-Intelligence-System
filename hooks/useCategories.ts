import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, orderBy, query, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

const COL = "categories";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const q = query(collection(db, COL), orderBy("order"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Category, "id">) => {
      await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<Category, "id">> }) => {
      await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await deleteDoc(doc(db, COL, id)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
