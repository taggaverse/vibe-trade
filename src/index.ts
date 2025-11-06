import { app } from "./agent";

const port = Number(process.env.PORT ?? 8787);

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    
    // For root path, use Daydreams UI but clear conflicting ethereum provider
    if (url.pathname === "/" || url.pathname === "/index.html") {
      try {
        const response = await app.fetch(req);
        
        if (response.headers.get("content-type")?.includes("text/html")) {
          let html = await response.text();
          
          // Remove evmAsk.js script tags to prevent collision
          html = html.replace(/<script[^>]*evmAsk[^>]*><\/script>/gi, "");
          
          // Inject x402-fetch and disable evmAsk.js
          const x402Script = `<script>
// Disable evmAsk.js by preventing its initialization
window.disableEvmAsk = true;
console.log('[vibe-trade] ✅ Disabled evmAsk.js, using x402-fetch for payments');
</script>
<script src="https://cdn.jsdelivr.net/npm/x402-fetch@latest"></script>
<script>
console.log('[vibe-trade] ✅ x402-fetch loaded for frontend payments');
</script>`;
          
          // Inject at the very beginning of <head>
          if (html.includes("<head>")) {
            html = html.replace("<head>", `<head>${x402Script}`);
          } else if (html.includes("<HEAD>")) {
            html = html.replace("<HEAD>", `<HEAD>${x402Script}`);
          } else {
            // Fallback: add before first script tag
            html = html.replace("<script", `${x402Script}<script`);
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
  `🚀 Agent ready at http://${server.hostname}:${server.port}/.well-known/agent.json`
);
