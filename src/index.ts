import { app } from "./agent";

const port = Number(process.env.PORT ?? 8787);

const minimalUI = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vibe Trade - x402 Agent</title>
  <script src="https://cdn.jsdelivr.net/npm/x402-fetch@latest"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { margin-bottom: 10px; color: #60a5fa; }
    .subtitle { color: #94a3b8; margin-bottom: 30px; }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .form-group { margin-bottom: 16px; }
    label { display: block; margin-bottom: 6px; font-weight: 500; color: #cbd5e1; }
    input, select {
      width: 100%;
      padding: 10px;
      background: #0f172a;
      border: 1px solid #334155;
      color: #e2e8f0;
      border-radius: 4px;
      font-family: monospace;
    }
    input:focus, select:focus { outline: none; border-color: #60a5fa; }
    button {
      width: 100%;
      padding: 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #2563eb; }
    button:disabled { background: #64748b; cursor: not-allowed; }
    #status {
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      display: none;
    }
    #status.loading { background: #1e3a8a; color: #93c5fd; display: block; }
    #status.success { background: #064e3b; color: #86efac; display: block; }
    #status.error { background: #7c2d12; color: #fca5a5; display: block; }
    #result {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 4px;
      padding: 16px;
      max-height: 500px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 12px;
      font-family: monospace;
      color: #94a3b8;
    }
    .endpoint-info {
      background: #1e293b;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      margin-top: 20px;
      border-radius: 4px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Vibe Trade Agent</h1>
    <p class="subtitle">AI-powered trading intelligence with x402 micropayments</p>
    
    <div class="card">
      <h2>Analyze Trading Opportunities</h2>
      <div class="form-group">
        <label for="symbol">Trading Symbol:</label>
        <input type="text" id="symbol" value="BTC" placeholder="e.g., BTC, ETH, SOL" />
      </div>
      <div class="form-group">
        <label for="timeframe">Timeframe:</label>
        <select id="timeframe">
          <option value="1m">1 minute</option>
          <option value="5m">5 minutes</option>
          <option value="15m">15 minutes</option>
          <option value="1h" selected>1 hour</option>
          <option value="4h">4 hours</option>
          <option value="1d">1 day</option>
          <option value="1w">1 week</option>
        </select>
      </div>
      <button onclick="invokeAgent()">💰 Invoke (x402 Payment)</button>
      <div id="status"></div>
    </div>

    <div class="card">
      <h2>Response:</h2>
      <div id="result">Ready to invoke...</div>
    </div>

    <div class="endpoint-info">
      <strong>ℹ️ How it works:</strong> Click "Invoke" → MetaMask prompts for payment → Agent analyzes → Response displays
    </div>
  </div>

  <script>
    async function invokeAgent() {
      const symbol = document.getElementById('symbol').value.toUpperCase().trim();
      const timeframe = document.getElementById('timeframe').value;
      const resultDiv = document.getElementById('result');
      const statusDiv = document.getElementById('status');
      const btn = event.target;
      
      if (!symbol) {
        statusDiv.className = 'error';
        statusDiv.textContent = '❌ Please enter a symbol';
        return;
      }
      
      btn.disabled = true;
      statusDiv.className = 'loading';
      statusDiv.textContent = '⏳ Connecting wallet and processing payment...';
      resultDiv.textContent = 'Loading...';
      
      try {
        console.log('Invoking agent:', { symbol, timeframe });
        
        // Call the analyze endpoint with x402-fetch
        // x402-fetch will handle 402 responses and prompt for payment
        const analyzeResponse = await x402Fetch(window.location.origin + '/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entrypoint: 'analyze',
            input: { symbol, timeframe }
          })
        });
        
        if (!analyzeResponse.ok) {
          throw new Error(\`HTTP \${analyzeResponse.status}: \${analyzeResponse.statusText}\`);
        }
        
        const data = await analyzeResponse.json();
        statusDiv.className = 'success';
        statusDiv.textContent = '✅ Payment successful! Agent processed request.';
        resultDiv.textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        console.error('Error:', error);
        statusDiv.className = 'error';
        statusDiv.textContent = \`❌ Error: \${error.message}\`;
        resultDiv.textContent = \`Error: \${error.message}\\n\\nMake sure:\\n1. MetaMask is installed\\n2. Connected to Base network\\n3. Have USDC balance\\n4. x402-fetch loaded: \${typeof window.x402Fetch}\`;
      } finally {
        btn.disabled = false;
      }
    }
    
    // Check on load
    window.addEventListener('load', () => {
      const status = document.getElementById('status');
      if (typeof window.x402Fetch === 'function') {
        console.log('✅ x402-fetch loaded');
      } else {
        status.className = 'error';
        status.textContent = '⚠️ x402-fetch failed to load';
        status.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Serve minimal UI at root
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(minimalUI, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    
    // All other requests go to agent
    return app.fetch(req);
  }
});

console.log(
  `🚀 Agent ready at http://${server.hostname}:${server.port}/.well-known/agent.json`
);
