import { app } from "./agent";

const port = Number(process.env.PORT ?? 8787);

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Serve minimal HTML that loads x402-fetch FIRST to prevent collision
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vibe Trade Agent</title>
          <!-- Load x402-fetch FIRST (before Daydreams UI) to prevent ethereum provider collision -->
          <script src="https://cdn.jsdelivr.net/npm/x402-fetch@latest"></script>
        </head>
        <body>
          <div id="app"></div>
          <script>
            console.log('[vibe-trade] ✅ x402-fetch loaded');
            console.log('[vibe-trade] ✅ window.ethereum:', window.ethereum ? 'defined' : 'undefined');
            console.log('[vibe-trade] ✅ window.x402Fetch:', typeof window.x402Fetch);
          </script>
        </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
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
