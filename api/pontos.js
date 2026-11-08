import { put, list, del } from "@vercel/blob";
const ok = (req) => !!process.env.EDIT_PASSWORD && req.headers["x-edit-password"] === process.env.EDIT_PASSWORD;
const msg = (e) => (/token|credential|store/i.test(e.message) ? "O Blob não está conectado ao projeto no Vercel (Storage → Blob) ou faltou o redeploy. Detalhe: " + e.message : e.message);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.setHeader("cache-control", "public, s-maxage=30, stale-while-revalidate=600");
      const { blobs } = await list({ prefix: "pontos/" });
      if (!blobs.length) return res.status(200).json(null);
      const last = blobs.reduce((a, b) => (new Date(a.uploadedAt) > new Date(b.uploadedAt) ? a : b));
      const r = await fetch(last.url, { cache: "no-store" });
      return res.status(200).json(await r.json());
    }
    res.setHeader("cache-control", "no-store");
    if (req.method === "PUT") {
      if (!ok(req)) return res.status(401).json({ erro: "senha" });
      const d = req.body;
      if (!d || !Array.isArray(d.pts) || !Array.isArray(d.cats)) return res.status(400).json({ erro: "dados" });
      const { blobs } = await list({ prefix: "pontos/" });
      await put("pontos/dados.json", JSON.stringify(d), { access: "public", contentType: "application/json", addRandomSuffix: true });
      if (blobs.length) await del(blobs.map((b) => b.url));
      return res.status(200).json({ ok: true });
    }
    res.status(405).end();
  } catch (e) {
    res.setHeader("cache-control", "no-store");
    res.status(500).json({ erro: msg(e) });
  }
}
