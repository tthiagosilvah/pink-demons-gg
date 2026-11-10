const PERFIL = "pinkdemons.gg";

// 1) Oficial: precisa da variável IG_ACCESS_TOKEN
async function viaToken(token) {
  const r = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=1&access_token=${token}`);
  const j = await r.json();
  return (j.data && j.data[0]) || null;
}

// 2) Sem chave: lê o código da postagem mais recente na página de embed pública do perfil
async function viaEmbed() {
  const r = await fetch(`https://www.instagram.com/${PERFIL}/embed/`, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", "accept-language": "pt-BR,pt;q=0.9" } });
  const html = await r.text();
  const m = html.match(/"shortcode":"([A-Za-z0-9_-]{5,})"/) || html.match(/\\?\/(?:p|reel)\\?\/([A-Za-z0-9_-]{5,})/);
  return m ? m[1] : null;
}

export default async function handler(req, res) {
  res.setHeader("cache-control", "public, s-maxage=600, stale-while-revalidate=3600");
  try {
    if (process.env.IG_ACCESS_TOKEN) {
      const post = await viaToken(process.env.IG_ACCESS_TOKEN);
      if (post) return res.status(200).json({ post });
    }
    return res.status(200).json({ shortcode: await viaEmbed() });
  } catch (e) {
    return res.status(200).json({});
  }
}
