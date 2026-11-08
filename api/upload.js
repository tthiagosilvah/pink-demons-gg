import * as blob from "@vercel/blob";
import * as client from "@vercel/blob/client";

const TIPOS = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"];
const MAX = 500 * 1024 * 1024;
const J = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });

export default async function handler(request) {
  const senha = process.env.EDIT_PASSWORD;
  if (request.method === "GET") {
    if (!senha || request.headers.get("x-edit-password") !== senha) return J({ erro: "senha" }, 401);
    return J({ store: !!process.env.BLOB_STORE_ID, webhook: !!process.env.BLOB_WEBHOOK_PUBLIC_KEY, presigned: !!client.handleUploadPresigned });
  }
  try {
    if (!client.handleUploadPresigned) throw new Error("A versão instalada do @vercel/blob é antiga. Suba o package.json novo e faça o Redeploy.");
    const body = await request.json();
    const json = await client.handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload) => {
        if (!senha || clientPayload !== senha) throw new Error("senha");
        const token = await blob.issueSignedToken({ pathname, operations: ["put"], allowedContentTypes: TIPOS, maximumSizeInBytes: MAX, validUntil: Date.now() + 60 * 60 * 1000 });
        return { token, urlOptions: { allowedContentTypes: TIPOS, maximumSizeInBytes: MAX, validUntil: Date.now() + 60 * 60 * 1000, addRandomSuffix: true, allowOverwrite: false } };
      },
      onUploadCompleted: async () => {},
    });
    return J(json);
  } catch (e) {
    return J({ error: e.message, erro: e.message }, 400);
  }
}
