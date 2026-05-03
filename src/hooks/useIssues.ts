import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection, getDocs, addDoc, updateDoc,
  doc, query, where, serverTimestamp, orderBy, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Issue {
  id: string;
  recordId: string;
  formId: string;
  fieldLabel: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  reportedBy: string;
  resolvedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const COL = "issues";

export function useIssues(status?: Issue["status"]) {
  return useQuery({
    queryKey: ["issues", status ?? "all"],
    queryFn: async () => {
      const constraints: Parameters<typeof query>[1][] = [];
      if (status) constraints.push(where("status", "==", status));
      constraints.push(orderBy("createdAt", "desc"));
      const q = query(collection(db, COL), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Issue);
    },
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Issue, "id" | "createdAt" | "updatedAt">) => {
      const now = serverTimestamp();
      await addDoc(collection(db, COL), { ...data, createdAt: now, updatedAt: now });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<Issue, "id">> }) => {
      await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
  });
}
