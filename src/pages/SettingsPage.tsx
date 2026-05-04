// src/pages/SettingsPage.tsx
import { useState } from "react";
import { Settings, Bell, CheckCircle2, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const [token, setToken] = useState(
    localStorage.getItem("line_token") ?? ""
  );
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  const handleSave = () => {
    localStorage.setItem("line_token", token);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "✅ ทดสอบการแจ้งเตือน SMC Ward 15 สำเร็จ",
          token,
        }),
      });
      setTestResult(res.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6 animate-in">
      <div className="flex items-center gap-2 mb-5">
        <Settings size={22} style={{ color: "var(--accent-violet)" }} />
        <h2 className="text-lg font-bold" style={{ color: "var(--tx-primary)" }}>
          ตั้งค่าระบบ
        </h2>
      </div>

      {/* LINE Notify Card */}
      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Bell size={18} style={{ color: "var(--accent-violet)" }} />
          <h3 className="font-semibold" style={{ color: "var(--tx-primary)" }}>
            LINE Notify
          </h3>
          <a
            href="https://notify.line.me/"
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs flex items-center gap-1 text-violet-600 hover:underline"
          >
            รับ Token <ExternalLink size={11} />
          </a>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--tx-primary)" }}>
            LINE Notify Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ใส่ token จาก notify.line.me"
            className="input-glass"
          />
          <p className="text-xs mt-1.5 opacity-50" style={{ color: "var(--tx-secondary)" }}>
            Token เก็บเฉพาะในเครื่องนี้ ไม่ถูกส่งไปที่ Server
          </p>
        </div>

        {/* Test result */}
        {testResult === "ok" && (
          <div className="flex items-center gap-2 text-emerald-700 text-sm">
            <CheckCircle2 size={16} /> ส่งสำเร็จ! ตรวจสอบ LINE ของคุณ
          </div>
        )}
        {testResult === "fail" && (
          <p className="text-rose-600 text-sm">ส่งไม่สำเร็จ — ตรวจสอบ Token อีกครั้ง</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={!token || testing}
            className="btn-ghost flex-1"
          >
            {testing ? "กำลังทดสอบ…" : "ทดสอบ"}
          </button>
          <button onClick={handleSave} className="btn-primary flex-1">
            {saved ? "✓ บันทึกแล้ว" : "บันทึก"}
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="glass-card rounded-2xl p-5 mt-4 flex flex-col gap-2">
        <h3 className="font-semibold text-sm" style={{ color: "var(--tx-primary)" }}>
          เกี่ยวกับระบบ
        </h3>
        <p className="text-xs opacity-70" style={{ color: "var(--tx-secondary)" }}>
          <strong>SMC Excellence Data Center</strong><br />
          พัฒนาโดย หอผู้ป่วยพิเศษชั้น 15<br />
          โทร 66532-4
        </p>
      </div>
    </div>
  );
}
