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
          
          // Inject cleanup script at the VERY TOP of <head>
          // This removes any conflicting ethereum provider before evmAsk.js loads
          const cleanupScript = `<script>
(function() {
  // Remove any existing ethereum provider that might have configurable: false
  // This prevents collision when evmAsk.js tries to inject its own
  try {
    delete window.ethereum;
    console.log('[vibe-trade] ✅ Cleared conflicting ethereum provider');
  } catch (e) {
    console.warn('[vibe-trade] Could not clear ethereum:', e);
  }
})();
</script>`;
          
          // Inject at the very beginning of <head>
          if (html.includes("<head>")) {
            html = html.replace("<head>", `<head>${cleanupScript}`);
          } else if (html.includes("<HEAD>")) {
            html = html.replace("<HEAD>", `<HEAD>${cleanupScript}`);
          } else {
            // Fallback: add before first script tag
            html = html.replace("<script", `${cleanupScript}<script`);
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
