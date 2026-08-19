import { handleFlightRequest } from "../js/flight-lookup.js";
import { corsHeaders } from "../js/http-util.js";

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
  const { status, body } = await handleFlightRequest(url, process.env);
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

export const config = { api: { bodyParser: false } };

export { corsHeaders };
