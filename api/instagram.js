const PERFIL = "pinkdemons.gg";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// 1) Oficial: precisa da variável IG_ACCESS_TOKEN
async function viaToken(token) {
  const r = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=1&access_token=${token}`);
  const j = await r.json();
  return (j.data && j.data[0]) || null;
}

// 2) Sem chave: consulta pública do perfil; pega a postagem com a data mais nova (ignora fixadas)
async function viaPerfil() {
  const r = await fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${PERFIL}`, { headers: { "x-ig-app-id": "936619743392459", "user-agent": UA, "accept-language": "pt-BR,pt;q=0.9" } });
  if (!r.ok) return null;
  const j = await r.json();
  const edges = (j.data && j.data.user && j.data.user.edge_owner_to_timeline_media && j.data.user.edge_owner_to_timeline_media.edges) || [];
  if (!edges.length) return null;
  return edges.map((e) => e.node).sort((a, b) => b.taken_at_timestamp - a.taken_at_timestamp)[0].shortcode;
}

// 3) Plano C: lê o código na página de embed do perfil
async function viaEmbed() {
  const r = await fetch(`https://www.instagram.com/${PERFIL}/embed/`, { headers: { "user-agent": UA, "accept-language": "pt-BR,pt;q=0.9" } });
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
    let shortcode = null;
    try { shortcode = await viaPerfil(); } catch (e) {}
    if (!shortcode) { try { shortcode = await viaEmbed(); } catch (e) {} }
    return res.status(200).json({ shortcode });
  } catch (e) {
    return res.status(200).json({});
  }
}
