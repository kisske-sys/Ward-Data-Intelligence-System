import { useState } from "react";
import { X, Lock, Loader2 } from "lucide-react";
import { useEditor } from "@/hooks/useEditor";

interface Props { onClose: () => void; }

export default function EditorLoginModal({ onClose }: Props) {
  const { login } = useEditor();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(password);
    setLoading(false);
    if (ok) {
      onClose();
    } else {
      setError("รหัสผ่านไม่ถูกต้อง");
      setPassword("");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock size={20} style={{ color: "var(--accent-violet)" }} />
            <span className="font-bold text-lg" style={{ color: "var(--tx-primary)" }}>
              เข้าโหมด Editor
            </span>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="รหัสผ่าน Editor"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-glass"
            autoFocus
          />
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading || !password} className="btn-primary flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            เข้าสู่ระบบ
          </button>
        </form>
        <p className="text-xs text-center mt-3 opacity-50" style={{ color: "var(--tx-primary)" }}>
          สำหรับผู้ดูแลระบบเท่านั้น
        </p>
      </div>
    </div>
  );
}
