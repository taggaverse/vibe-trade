import { app } from "./agent";

const port = Number(process.env.PORT ?? 8787);

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    
    // For root path, get the agent-kit UI and inject x402-fetch FIRST
    if (url.pathname === "/" || url.pathname === "/index.html") {
      try {
        // Get the response from agent-kit UI
        const response = await app.fetch(req);
        
        // If it's HTML, inject x402-fetch at the top
        if (response.headers.get("content-type")?.includes("text/html")) {
          let html = await response.text();
          
          // Inject x402-fetch script at the very beginning of <head>
          // This ensures it loads BEFORE evmAsk.js
          const x402Script = `<script src="https://cdn.jsdelivr.net/npm/x402-fetch@latest"></script>`;
          
          if (html.includes("<head>")) {
            html = html.replace("<head>", `<head>\n    ${x402Script}`);
          } else if (html.includes("<HEAD>")) {
            html = html.replace("<HEAD>", `<HEAD>\n    ${x402Script}`);
          } else {
            // Fallback: add before first script tag
            html = html.replace("<script", `${x402Script}\n    <script`);
          }
          
          return new Response(html, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }
        
        return response;
      } catch (error) {
        console.error("[vibe-trade] Error serving UI:", error);
        // Fall through to agent if error
      }
    }
    
    // All other requests go to agent (endpoints, manifest, etc.)
    return app.fetch(req);
  }
});

console.log(
  `🚀 Agent ready at http://${server.hostname}:${server.port}/`
);
console.log(
  `📊 Agent manifest at http://${server.hostname}:${server.port}/.well-known/agent.json`
);
