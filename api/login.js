const ok = (req) => !!process.env.EDIT_PASSWORD && req.headers["x-edit-password"] === process.env.EDIT_PASSWORD;

export default function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  if (!ok(req)) return res.status(401).json({ erro: "senha" });
  res.status(200).json({ ok: true });
}
