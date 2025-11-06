import { app } from "./agent";

const port = Number(process.env.PORT ?? 8787);

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    
    // For root path, inject ethereum provider guard to prevent collision
    if (url.pathname === "/" || url.pathname === "/index.html") {
      try {
        const response = await app.fetch(req);
        
        if (response.headers.get("content-type")?.includes("text/html")) {
          let html = await response.text();
          
          // Inject ethereum provider guard BEFORE any scripts load
          // This allows evmAsk.js to redefine it without collision
          const guardScript = `<script>
(function() {
  // Pre-define window.ethereum with configurable: true
  // This allows evmAsk.js and other libraries to redefine it
  if (!window.ethereum) {
    try {
      Object.defineProperty(window, 'ethereum', {
        value: null,
        writable: true,
        configurable: true
      });
      console.log('[vibe-trade] ✅ Ethereum provider guard installed');
    } catch (e) {
      console.warn('[vibe-trade] Could not install ethereum guard:', e);
    }
  }
})();
</script>`;
          
          // Inject at the very beginning of <head>
          if (html.includes("<head>")) {
            html = html.replace("<head>", `<head>${guardScript}`);
          } else if (html.includes("<HEAD>")) {
            html = html.replace("<HEAD>", `<HEAD>${guardScript}`);
          } else {
            // Fallback: add before first script tag
            html = html.replace("<script", `${guardScript}<script`);
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
