import { app } from "./agent";

const port = Number(process.env.PORT ?? 8787);

// Serve the agent app directly - agent-kit handles all routing including:
// - GET / → built-in UI with MetaMask integration
// - GET /.well-known/agent.json → manifest
// - POST /entrypoints/:key/invoke → payment handling + handler execution
// - GET /health → health check
const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(
  `🚀 Agent ready at http://${server.hostname}:${server.port}/.well-known/agent.json`
);
