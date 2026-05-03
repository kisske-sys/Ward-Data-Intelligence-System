import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SignJWT, jwtVerify } from "jose";

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? "smc-ward15-default-secret-please-change-me"
  );

const EDITOR_PASSWORD = process.env.EDITOR_PASSWORD ?? "admin1234";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).end();
  }

  const action = (req.query.action as string) ?? req.body?.action;

  if (action === "login") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { password } = req.body ?? {};
    if (!password || password !== EDITOR_PASSWORD) {
      return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
    }
    const token = await new SignJWT({ isEditor: true })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(getSecret());
    return res.json({ success: true, token });
  }

  if (action === "me") {
    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return res.json({ isEditor: false });
    try {
      const { payload } = await jwtVerify(token, getSecret());
      return res.json({ isEditor: !!payload.isEditor });
    } catch {
      return res.json({ isEditor: false });
    }
  }

  return res.status(400).json({ error: "Invalid action. Use ?action=login or ?action=me" });
}
