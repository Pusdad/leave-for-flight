import { handleDriveRequest } from "../js/drive.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }
  const host = req.headers.host || "localhost";
  const url = new URL(req.url, `https://${host}`);
  const { status, body } = await handleDriveRequest(url, process.env);
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}
