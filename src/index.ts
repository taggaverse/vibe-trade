import { app } from "./agent";
import { readFileSync } from "fs";
import { join } from "path";

const port = Number(process.env.PORT ?? 8787);

// Read UI from file
let minimalUI = "";
try {
  const uiPath = join(import.meta.dir, "../public/index.html");
  minimalUI = readFileSync(uiPath, "utf-8");
} catch (error) {
  console.warn("Could not load UI file:", error);
  minimalUI = "<h1>Agent is running</h1>";
}

// Serve the UI at root GET, pass everything else to agent-kit
const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Serve minimal UI at root GET only
    if ((url.pathname === "/" || url.pathname === "/index.html") && req.method === "GET") {
      return new Response(minimalUI, {
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
