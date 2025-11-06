import { app } from "./agent";
import { join } from "path";

const port = Number(process.env.PORT ?? 8787);

// Serve static files (custom UI)
const publicDir = join(import.meta.dir, "../public");

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Serve custom UI at root
    if (url.pathname === "/" || url.pathname === "/index.html") {
      try {
        const file = await Bun.file(join(publicDir, "index.html")).text();
        return new Response(file, {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      } catch (e) {
        console.warn("[vibe-trade] Failed to serve index.html:", e);
        // Fall back to agent if file not found
      }
    }
    
    // All other requests go to agent
    return app.fetch(req);
  }
});

console.log(
  `🚀 Agent ready at http://${server.hostname}:${server.port}/`
);
console.log(
  `📊 Agent manifest at http://${server.hostname}:${server.port}/.well-known/agent.json`
);
