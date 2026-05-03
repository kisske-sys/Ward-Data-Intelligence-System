import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, serverTimestamp, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Nurse {
  id: string;
  name: string;
  role: "RN" | "NA" | "PN";
  active: boolean;
}

const COL = "nurses";

export function useNurses(activeOnly = true) {
  return useQuery({
    queryKey: ["nurses", activeOnly],
    queryFn: async () => {
      const q = activeOnly
        ? query(collection(db, COL), where("active", "==", true), orderBy("name"))
        : query(collection(db, COL), orderBy("name"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Nurse);
    },
  });
}

export function useCreateNurse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Nurse, "id">) => {
      await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nurses"] }),
  });
}

export function useUpdateNurse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<Nurse, "id">> }) => {
      await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nurses"] }),
  });
}

export function useDeleteNurse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await deleteDoc(doc(db, COL, id)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nurses"] }),
  });
}
