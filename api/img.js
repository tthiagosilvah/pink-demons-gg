import { put } from "@vercel/blob";
const ok = (req) => !!process.env.EDIT_PASSWORD && req.headers["x-edit-password"] === process.env.EDIT_PASSWORD;
const msg = (e) => (/token/i.test(e.message) ? "O Blob não está conectado ao projeto no Vercel (Storage → Blob) ou faltou o redeploy." : e.message);

export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  try {
    if (req.method !== "PUT") return res.status(405).end();
    if (!ok(req)) return res.status(401).json({ erro: "senha" });
    const m = String((req.body && req.body.data) || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
    if (!m) return res.status(400).json({ erro: "imagem" });
    const b = await put("img/foto." + m[1].split("/")[1], Buffer.from(m[2], "base64"), { access: "public", contentType: m[1], addRandomSuffix: true });
    res.status(200).json({ url: b.url });
  } catch (e) {
    res.status(500).json({ erro: msg(e) });
  }
}
