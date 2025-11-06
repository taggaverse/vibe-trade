import { app } from "./agent";

const port = Number(process.env.PORT ?? 8787);

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    
    // For root path, remove evmAsk.js to prevent ethereum provider collision
    if (url.pathname === "/" || url.pathname === "/index.html") {
      try {
        const response = await app.fetch(req);
        
        if (response.headers.get("content-type")?.includes("text/html")) {
          let html = await response.text();
          
          // Remove evmAsk.js script tags - they cause the collision
          html = html.replace(/<script[^>]*evmAsk\.js[^>]*><\/script>/gi, "");
          html = html.replace(/<script[^>]*evmAsk[^>]*><\/script>/gi, "");
          
          // Remove inline evmAsk code
          html = html.replace(/<script[^>]*>[\s\S]*?evmAsk[\s\S]*?<\/script>/gi, "");
          
          console.log("[vibe-trade] ✅ Removed evmAsk.js from UI");
          
          return new Response(html, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }
        
        return response;
      } catch (error) {
        console.error("[vibe-trade] Error processing UI:", error);
      }
    }
    
    return app.fetch(req);
  }
});

console.log(
  `🚀 Agent ready at http://${server.hostname}:${server.port}/.well-known/agent.json`
);
