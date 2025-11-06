import { app } from "./agent";
import { readFileSync } from "fs";
import { join } from "path";

const port = Number(process.env.PORT ?? 8787);

// Read custom UI (agent-kit's default UI has HTML entity encoding issues)
let customUI = "";
try {
  const uiPath = join(import.meta.dir, "../public/index.html");
  customUI = readFileSync(uiPath, "utf-8");
} catch (error) {
  console.warn("Could not load custom UI:", error);
}

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Serve custom UI at root GET only
    if ((url.pathname === "/" || url.pathname === "/index.html") && req.method === "GET") {
      return new Response(customUI, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    
    // All other requests go to agent-kit
    return await app.fetch(req);
  }
});

console.log(
  `🚀 Agent ready at http://${server.hostname}:${server.port}/.well-known/agent.json`
);
