import { useEffect } from "react";
import { onSnapshot } from "firebase/firestore";

// ─── Categories ──────────────────────────────────────────────
export function useCategories() {
  const qc = useQueryClient();

  // (ของใหม่) อัปเดตข้อมูล Real-time เวลาแอดมินเครื่องอื่นเพิ่มหมวดหมู่
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const liveData = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
      qc.setQueryData(["categories"], liveData);
    });
    return () => unsub();
  }, [qc]);

  // (ของเดิม 100% รักษาไว้)
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// ... (useCreateCategory, useUpdateCategory, useDeleteCategory โค้ดเดิมของคุณเก็บไว้ทั้งหมด!) ...

// ─── Forms ───────────────────────────────────────────────────
export function useForms(categoryId?: string) {
  const qc = useQueryClient();

  // (ของใหม่) อัปเดตฟอร์ม Real-time ทุกคนเห็นฟอร์มใหม่ทันที
  useEffect(() => {
    const col = collection(db, "forms");
    const q = categoryId
      ? query(col, where("categoryId", "==", categoryId), orderBy("name", "asc"))
      : query(col, orderBy("name", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const liveData = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FormTemplate));
      const qKey = ["forms", categoryId ?? "all"];
      qc.setQueryData(qKey, liveData);
    });
    return () => unsub();
  }, [qc, categoryId]);

  // (ของเดิม 100%)
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

// (useForm, useCreateForm โค้ดเดิมของคุณเก็บไว้ทั้งหมด!)
