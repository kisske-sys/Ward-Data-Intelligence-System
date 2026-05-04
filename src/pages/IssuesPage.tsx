// src/pages/IssuesPage.tsx
import { useState } from "react";
import { AlertTriangle, Send, Loader2 } from "lucide-react";

export default function IssuesPage() {
  const [msg,       setMsg]       = useState("");
  const [reporter,  setReporter]  = useState("");
  const [sending,   setSending]   = useState(false);
  const [done,      setDone]      = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem("line_token") ?? "";
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `🚨 แจ้งปัญหา\n👤 ${reporter || "ไม่ระบุ"}\n\n${msg}`,
          ...(token ? { token } : {}),
        }),
      });
      setDone(true);
      setMsg("");
      setTimeout(() => setDone(false), 3000);
    } catch {
      alert("ส่งไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6 animate-in">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle size={22} style={{ color: "var(--accent-amber)" }} />
        <h2 className="text-lg font-bold" style={{ color: "var(--tx-primary)" }}>
          แจ้งปัญหา / ข้อเสนอแนะ
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--tx-primary)" }}>
            ชื่อผู้แจ้ง (ไม่บังคับ)
          </label>
          <input type="text" value={reporter}
            onChange={(e) => setReporter(e.target.value)}
            placeholder="ชื่อ-นามสกุล"
            className="input-glass" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--tx-primary)" }}>
            รายละเอียดปัญหา <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="อธิบายปัญหาหรือข้อเสนอแนะ…"
            rows={5}
            className="input-glass"
          />
        </div>
        {done && (
          <p className="text-emerald-700 text-sm font-medium">
            ✅ ส่งข้อมูลสำเร็จ ขอบคุณ!
          </p>
        )}
        <button
          type="submit"
          disabled={!msg.trim() || sending}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          ส่งข้อมูล
        </button>
      </form>
    </div>
  );
}
