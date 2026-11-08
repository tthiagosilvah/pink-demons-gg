import { handleUpload } from "@vercel/blob/client";

export default async function handler(req, res) {
  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!process.env.EDIT_PASSWORD || clientPayload !== process.env.EDIT_PASSWORD) throw new Error("senha");
        return {
          allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime", "video/ogg"],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    res.status(200).json(json);
  } catch (e) {
    res.status(400).json({ error: e.message, erro: e.message });
  }
}
