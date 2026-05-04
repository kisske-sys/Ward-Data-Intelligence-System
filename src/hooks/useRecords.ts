import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection, getDocs, addDoc, onSnapshot,
  query, where, serverTimestamp, orderBy, limit, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface RecordValue {
  fieldId: string;
  value: string | number | string[] | null;
  hasIssue?: boolean;
}

export interface FormRecord {
  id: string;
  formId: string;
  recordDate: string;
  shift: string;
  recordedBy: string;
  values: RecordValue[];
  hasLowStock: boolean;
  hasExpired: boolean;
  hasIssues: boolean;
  createdAt: Timestamp;
}

const COL = "records";

export function useRecords(formId?: string, date?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const constraints: Parameters<typeof query>[1][] = [];
    if (formId) constraints.push(where("formId", "==", formId));
    if (date)   constraints.push(where("recordDate", "==", date));
    constraints.push(orderBy("createdAt", "desc"));
    
    // อัปเดตข้อมูลอัตโนมัติเมื่อมีการบันทึกจากเครื่องอื่น (Real-time Sync)
    const unsub = onSnapshot(query(collection(db, COL), ...constraints), (snap) => {
      const liveData = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FormRecord));
      qc.setQueryData(["records", formId ?? "all", date ?? "all"], liveData);
    });
    return () => unsub();
  }, [qc, formId, date]);

  return useQuery({
    queryKey: ["records", formId ?? "all", date ?? "all"],
    queryFn: async () => {
      const constraints: Parameters<typeof query>[1][] = [];
      if (formId) constraints.push(where("formId", "==", formId));
      if (date)   constraints.push(where("recordDate", "==", date));
      constraints.push(orderBy("createdAt", "desc"));
      const q = query(collection(db, COL), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FormRecord);
    },
  });
}

export function useRecentRecords(limitCount = 20) {
  const qc = useQueryClient();

  useEffect(() => {
    const q = query(collection(db, COL), orderBy("createdAt", "desc"), limit(limitCount));
    const unsub = onSnapshot(q, (snap) => {
      const liveData = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FormRecord));
      qc.setQueryData(["records", "recent", limitCount], liveData);
    });
    return () => unsub();
  }, [qc, limitCount]);

  return useQuery({
    queryKey: ["records", "recent", limitCount],
    queryFn: async () => {
      const q = query(collection(db, COL), orderBy("createdAt", "desc"), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FormRecord);
    },
  });
}

export function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<FormRecord, "id" | "createdAt">) => {
      await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["records"] }),
  });
}
