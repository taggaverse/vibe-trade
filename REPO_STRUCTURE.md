# Repository Structure

## 📁 Clean Organization

```
vibe-trade/
├── README.md                    # Main project README
├── REPO_STRUCTURE.md            # This file
├── .gitignore
├── railway.json                 # Railway deployment config
├── vibe.trade.code-workspace    # VS Code workspace
│
├── docs/                        # 📚 All Documentation
│   ├── C2C_INTEGRATION_GUIDE.md
│   ├── C2C_PHASE1_SUMMARY.md
│   ├── C2C_PHASE2_SUMMARY.md
│   ├── DATA_COLLECTION_GUIDE.md
│   ├── HYPERLIQUID_INTEGRATION.md
│   ├── TRAINING_DATA_INTEGRATION.md
│   ├── X402_PERPS_ENDPOINT.md
│   └── .gitkeep
│
├── scripts/                     # 🔧 Test & Utility Scripts
│   ├── test-agent.sh
│   ├── test-c2c-integration.sh
│   └── .gitkeep
│
└── dreams/                      # 🤖 Main Agent Application
    ├── src/
    │   ├── agent.ts             # Main agent definition
    │   ├── index.ts             # HTTP server
    │   ├── hyperliquid-perps.ts # Perpetuals integration
    │   ├── c2c-wrapper.ts       # C2C optimization
    │   ├── training-data-collector.ts
    │   └── benchmarks.ts
    │
    ├── package.json
    ├── tsconfig.json
    ├── bun.lock
    ├── .env.example             # Configuration template
    ├── .env                     # Local configuration
    ├── README.md                # Dreams app README
    └── training_data.jsonl      # Collected training data
```

## 📚 Documentation Access

All documentation is organized in `/docs` for easy access:

| Document | Purpose |
|----------|---------|
| `C2C_INTEGRATION_GUIDE.md` | Complete C2C optimization guide |
| `C2C_PHASE1_SUMMARY.md` | Phase 1: C2C wrapper implementation |
| `C2C_PHASE2_SUMMARY.md` | Phase 2: C2C integration into agent |
| `DATA_COLLECTION_GUIDE.md` | Training data collection strategy |
| `HYPERLIQUID_INTEGRATION.md` | Perpetuals data integration details |
| `TRAINING_DATA_INTEGRATION.md` | Training data pipeline documentation |
| `X402_PERPS_ENDPOINT.md` | x402 perpetuals endpoint specification |

## 🔧 Scripts

Test and utility scripts are in `/scripts`:

- `test-agent.sh` - Basic agent functionality test
- `test-c2c-integration.sh` - C2C integration verification

## �� Quick Navigation

**To get started:**
```bash
cd dreams
bun install
bun run dev
```

**To read documentation:**
```bash
# View any doc
cat docs/HYPERLIQUID_INTEGRATION.md

# Or open in editor
code docs/
```

**To run tests:**
```bash
./scripts/test-agent.sh
./scripts/test-c2c-integration.sh
```

## ✅ What Was Cleaned Up

✅ Moved 7 markdown files to `/docs`  
✅ Moved 2 test scripts to `/scripts`  
✅ Created clean root README  
✅ Maintained all documentation access  
✅ Organized for scalability  
✅ Added `.gitkeep` files for empty folders  

## 🔄 Continuity

All documentation is still accessible and linked from the main README. Nothing was deleted—everything is organized for better maintainability.

**All files are still tracked by Git and accessible via:**
- GitHub web interface
- Local file system
- IDE file explorer
