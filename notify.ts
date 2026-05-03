import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, token: clientToken } = req.body ?? {};

  if (!message) return res.status(400).json({ error: "message is required" });

  const token = clientToken ?? process.env.LINE_NOTIFY_TOKEN;
  if (!token) {
    return res.status(400).json({
      error: "ไม่พบ LINE Notify token — ใส่ token ในการตั้งค่าหรือใน Vercel environment variables (LINE_NOTIFY_TOKEN)",
    });
  }

  try {
    const body = new URLSearchParams();
    body.append("message", `\n🏥 SMC Ward 15\n${message}`);

    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const text = await response.text();
    if (response.ok) {
      return res.json({ success: true });
    } else {
      return res.status(response.status).json({ error: text });
    }
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
