// src/hooks/useEditor.ts
// Pattern: React Context ทำหน้าที่เป็น "single source of truth"
// ทุก component ที่เรียก useEditor() จะได้ state เดียวกันเสมอ

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────
interface EditorContextValue {
  isEditor: boolean;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

// ─── Context ─────────────────────────────────────────
// ค่าเริ่มต้น null — ใช้ตรวจว่า Provider ถูกวางไว้หรือยัง
const EditorContext = createContext<EditorContextValue | null>(null);

// ─── Provider ────────────────────────────────────────
export function EditorProvider({ children }: { children: ReactNode }) {
  const [isEditor, setIsEditor] = useState(false);
  const [loading, setLoading]   = useState(true); // true ระหว่างเช็ก token เก่า

  // ─────────────────────────────────────────────────
  // เช็ก token ที่เคยบันทึกไว้ใน localStorage เมื่อ App โหลด
  // ถ้า token ยังใช้ได้ → ผู้ใช้ไม่ต้องล็อกอินซ้ำ
  // ─────────────────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem("editor_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    // เรียก /api/auth?action=me เพื่อตรวจสอบความถูกต้องของ token
    fetch("/api/auth?action=me", {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setIsEditor(!!data.isEditor);
        if (!data.isEditor) {
          // token หมดอายุหรือไม่ถูกต้อง ลบทิ้ง
          localStorage.removeItem("editor_token");
        }
      })
      .catch(() => {
        // ถ้า network error ลบ token ออกเพื่อความปลอดภัย
        localStorage.removeItem("editor_token");
      })
      .finally(() => setLoading(false));
  }, []);

  // ─────────────────────────────────────────────────
  // login: ส่ง password ไปที่ /api/auth?action=login
  // คืนค่า true ถ้าสำเร็จ, false ถ้าล้มเหลว
  // ─────────────────────────────────────────────────
  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem("editor_token", data.token);
        setIsEditor(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // ─────────────────────────────────────────────────
  // logout: ล้าง state และ localStorage
  // ─────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("editor_token");
    setIsEditor(false);
  }, []);

  return (
    <EditorContext.Provider value={{ isEditor, loading, login, logout }}>
      {children}
    </EditorContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────
// Hook นี้จะ throw error ถ้าเรียกนอก EditorProvider
// ช่วยให้ debug ง่ายขึ้นมาก
export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor() ต้องใช้ภายใน <EditorProvider> เท่านั้น");
  }
  return ctx;
}
