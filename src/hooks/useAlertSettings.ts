import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AlertSettings {
  lowStockThreshold: number;
  expiryWarningDays: number;
  missedRecordAlertHours: number;
  lineNotifyEnabled: boolean;
  lineNotifyToken: string;
}

const DEFAULT: AlertSettings = {
  lowStockThreshold: 5,
  expiryWarningDays: 30,
  missedRecordAlertHours: 4,
  lineNotifyEnabled: false,
  lineNotifyToken: "",
};

const REF = () => doc(db, "settings", "alertSettings");

export function useAlertSettings() {
  return useQuery({
    queryKey: ["alertSettings"],
    queryFn: async () => {
      const snap = await getDoc(REF());
      return snap.exists() ? (snap.data() as AlertSettings) : DEFAULT;
    },
  });
}

export function useUpdateAlertSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AlertSettings>) => {
      await setDoc(REF(), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alertSettings"] }),
  });
}
