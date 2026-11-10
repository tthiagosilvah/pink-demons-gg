const LOGINS = ["nickymitravam", "jojogamequeen", "rivald0jr", "tthiagosilva", "bellahblake_", "manuzinha_sz", "ohinata_oficial", "kirablun", "taymede", "l7gaming_"];
let tok = null, tokExp = 0;

async function appToken(id, secret) {
  if (tok && Date.now() < tokExp) return tok;
  const r = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`, { method: "POST" });
  const j = await r.json();
  if (!j.access_token) throw new Error("token da Twitch recusado");
  tok = j.access_token; tokExp = Date.now() + (j.expires_in - 600) * 1000;
  return tok;
}

// Caminho oficial (precisa de TWITCH_CLIENT_ID e TWITCH_CLIENT_SECRET)
async function helix() {
  const id = process.env.TWITCH_CLIENT_ID, secret = process.env.TWITCH_CLIENT_SECRET;
  const h = { "Client-Id": id, Authorization: "Bearer " + (await appToken(id, secret)) };
  const [u, s] = await Promise.all([
    fetch("https://api.twitch.tv/helix/users?" + LOGINS.map((l) => "login=" + l).join("&"), { headers: h }).then((r) => r.json()),
    fetch("https://api.twitch.tv/helix/streams?first=100&" + LOGINS.map((l) => "user_login=" + l).join("&"), { headers: h }).then((r) => r.json()),
  ]);
  const live = new Map((s.data || []).map((x) => [x.user_login, x]));
  return (u.data || []).map((x) => {
    const st = live.get(x.login);
    return { login: x.login, name: x.display_name, avatar: x.profile_image_url, live: !!st, game: st && st.game_name, viewers: st && st.viewer_count, thumb: st && st.thumbnail_url.replace("{width}", "440").replace("{height}", "248") };
  });
}

// Sem chave: consulta pública da própria Twitch (mesma que o site deles usa)
async function gql() {
  const body = LOGINS.map((l) => ({ query: `query{user(login:"${l}"){displayName login profileImageURL(width:150) stream{viewersCount game{displayName}}}}` }));
  const r = await fetch("https://gql.twitch.tv/gql", { method: "POST", headers: { "Client-Id": "kimne78kx3ncx6brgo4mv6wki5h1ko", "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  return LOGINS.map((l, i) => {
    const u = j[i] && j[i].data && j[i].data.user;
    if (!u) return { login: l, live: false };
    const s = u.stream;
    return { login: l, name: u.displayName, avatar: u.profileImageURL, live: !!s, game: s && s.game && s.game.displayName, viewers: s && s.viewersCount };
  });
}

export default async function handler(req, res) {
  res.setHeader("cache-control", "public, s-maxage=60, stale-while-revalidate=300");
  let streamers = null, fonte = "";
  if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
    try { streamers = await helix(); fonte = "helix"; } catch (e) { streamers = null; }
  }
  if (!streamers) { try { streamers = await gql(); fonte = "gql"; } catch (e) { streamers = LOGINS.map((l) => ({ login: l, live: false })); fonte = "nenhuma"; } }
  res.status(200).json({ fonte, streamers });
}
