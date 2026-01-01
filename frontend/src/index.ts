import { config } from "dotenv";
import { join } from "path";
import { serve } from "bun";
import index from "./index.html";

config({ path: join(process.cwd(), "../.env") });

const port = parseInt(process.env.FRONTEND_PORT || "3001", 10);
const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

async function proxyToBackend(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const proxyUrl = `${backendUrl}${url.pathname}${url.search}`;

  try {
    const headers = new Headers(req.headers);
    headers.delete("host");

    const response = await fetch(proxyUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Credentials", "true");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return Response.json(
      { error: "Failed to connect to backend" },
      { status: 502 }
    );
  }
}

const server = serve({
  port,
  routes: {
    // API proxy routes
    "/api/*": {
      async GET(req) { return proxyToBackend(req); },
      async POST(req) { return proxyToBackend(req); },
      async PUT(req) { return proxyToBackend(req); },
      async DELETE(req) { return proxyToBackend(req); },
      async PATCH(req) { return proxyToBackend(req); },
      async OPTIONS(req) {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
          },
        });
      },
    },
    
    // Main SPA route
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Frontend server running at http://localhost:${port}`);
console.log(`📡 Proxying /api/* requests to ${backendUrl}`);