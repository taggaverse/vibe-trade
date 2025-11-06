import { app } from "./agent";

const port = Number(process.env.PORT ?? 8787);

// Serve the agent app directly - agent-kit handles all routing
// Entrypoints are exposed at: POST /entrypoints/:key/invoke
// For example: POST /entrypoints/analyze/invoke
const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(
  `🚀 Agent ready at http://${server.hostname}:${server.port}/.well-known/agent.json`
);
