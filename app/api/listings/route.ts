import { NextRequest } from "next/server";

const SERVICE_URL = process.env.DAFT_SERVICE_URL || "http://127.0.0.1:8000";

async function fetchWithRetry(url: string, init: RequestInit, attempts = 3, baseDelayMs = 1000): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`Bad status ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const delay = baseDelayMs * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Fetch failed");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("API route received request:", JSON.stringify(body, null, 2));
    
    const resp = await fetchWithRetry(`${SERVICE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    
    console.log("Service response status:", resp.status);
    const data = await resp.json();
    console.log("Service response data:", JSON.stringify(data, null, 2));
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("API route error:", err);
    return new Response(JSON.stringify({ error: err?.message || "unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


