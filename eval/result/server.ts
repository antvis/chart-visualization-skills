#!/usr/bin/env node
/**
 * AntV Skills Evaluation Server
 *
 * Express.js server with WebSocket support for real-time evaluation progress.
 *
 * Usage:
 *   node eval/result/server.js                    # Start server on default port 3100
 *   node eval/result/server.js --port=4000        # Custom port
 */

require('dotenv').config({ override: true });

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const EvaluationManager = require('../utils/eval-manager');
const WebSocketHandler = require('../utils/websocket');
const ProviderRegistry = require('../utils/provider-registry');
const logger = require('../utils/logger');

// ── Configuration ─────────────────────────────────────────────────────────────

const PORT = process.env.EVAL_PORT || 3100;
const IS_DEV = process.argv.includes('--dev');

const app = express();
const server = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (dev mode)
if (IS_DEV) {
  app.use((req, res, next) => {
    logger.debug({ method: req.method, path: req.path }, 'request');
    next();
  });
}

// ── Static Files ──────────────────────────────────────────────────────────────

// Serve eval directory static files (viewer.html, data/, result/)
app.use(express.static(__dirname));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/result', express.static(path.join(__dirname)));

// ── Core Components ───────────────────────────────────────────────────────────

const evalManager = new EvaluationManager();
const wss = new WebSocketServer({ server });
const wsHandler = new WebSocketHandler(wss, evalManager);

// ── API Routes ─────────────────────────────────────────────────────────────────

// GET /api/providers - List available AI providers and models
app.get('/api/providers', (req, res) => {
  const providers = ProviderRegistry.listProviders();
  res.json({ providers });
});

// GET /api/datasets - List available test datasets
app.get('/api/datasets', (req, res) => {
  const fs = require('fs');
  const dataDir = path.join(__dirname, 'data');

  try {
    const files = fs
      .readdirSync(dataDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const filePath = path.join(dataDir, f);
        const stat = fs.statSync(filePath);
        let count = 0;
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          count = Array.isArray(content)
            ? content.length
            : content.results?.length || 0;
        } catch (e) {
          logger.warn({ file: f, err: e.message }, 'Failed to read dataset file');
        }
        return {
          name: f,
          size: stat.size,
          testCount: count,
          modified: stat.mtime
        };
      });
    res.json({ datasets: files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/results - List evaluation result files
app.get('/api/results', (req, res) => {
  const fs = require('fs');
  const resultDir = path.join(__dirname);

  try {
    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir, { recursive: true });
    }
    const files = fs
      .readdirSync(resultDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const filePath = path.join(resultDir, f);
        const stat = fs.statSync(filePath);
        let summary = {};
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          summary = {
            model: content.model,
            provider: content.provider,
            totalTests:
              content.summary?.totalTests || content.results?.length || 0,
            avgSimilarity: content.summary?.avgSimilarity || 0,
            timestamp: content.timestamp
          };
        } catch (e) {
          logger.warn({ file: f, err: e.message }, 'Failed to read result file');
        }
        return {
          name: f,
          size: stat.size,
          modified: stat.mtime,
          summary
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    res.json({ results: files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/results/:filename - Get specific result JSON
app.get('/api/results/:filename', (req, res) => {
  const fs = require('fs');
  const filePath = path.join(__dirname, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Result file not found' });
  }

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/results/:filename - Delete a result file
app.delete('/api/results/:filename', async (req, res) => {
  const fs = require('fs').promises;
  const filePath = path.join(__dirname, req.params.filename);

  try {
    await fs.unlink(filePath);
    res.json({ success: true, message: `Deleted ${req.params.filename}` });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Result file not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/eval - Start new evaluation run
app.post('/api/eval', async (req, res) => {
  const options = req.body;

  // Validate provider
  const provider = options.provider || 'qwen';
  const model = options.model;

  if (!ProviderRegistry.hasProvider(provider)) {
    return res.status(400).json({ error: `Unknown provider: ${provider}` });
  }

  if (!ProviderRegistry.hasApiKey(provider)) {
    return res.status(400).json({
      error: `Missing API key for ${provider}. Set ${ProviderRegistry.getApiKeyEnv(provider)} environment variable.`
    });
  }

  try {
    const evalId = uuidv4();
    const evalOptions = {
      id: evalId,
      provider,
      model: model || ProviderRegistry.getDefaultModel(provider),
      dataset: options.dataset || 'g2-dataset-174.json ',
      sample: options.sample || null,
      full: options.full || false,
      concurrency: options.concurrency || 1,
      similarityAlgorithm: options.similarityAlgorithm || 'hybrid'
    };

    // Start evaluation (async, non-blocking)
    evalManager.startEvaluation(evalOptions, wsHandler);

    res.json({
      success: true,
      evalId,
      message: 'Evaluation started',
      options: evalOptions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/eval/:id/status - Get running evaluation status
app.get('/api/eval/:id/status', (req, res) => {
  const status = evalManager.getStatus(req.params.id);
  if (!status) {
    return res.status(404).json({ error: 'Evaluation not found' });
  }
  res.json(status);
});

// DELETE /api/eval/:id - Cancel running evaluation
app.delete('/api/eval/:id', (req, res) => {
  const cancelled = evalManager.cancelEvaluation(req.params.id);
  if (!cancelled) {
    return res
      .status(404)
      .json({ error: 'Evaluation not found or already completed' });
  }
  res.json({ success: true, message: 'Evaluation cancelled' });
});

// GET /api/compare/:file1/:file2 - Compare two result files
app.get('/api/compare/:file1/:file2', (req, res) => {
  const fs = require('fs');
  const { file1, file2 } = req.params;

  const filePath1 = path.join(__dirname, file1);
  const filePath2 = path.join(__dirname, file2);

  if (!fs.existsSync(filePath1) || !fs.existsSync(filePath2)) {
    return res
      .status(404)
      .json({ error: 'One or both result files not found' });
  }

  try {
    const result1 = JSON.parse(fs.readFileSync(filePath1, 'utf-8'));
    const result2 = JSON.parse(fs.readFileSync(filePath2, 'utf-8'));

    const comparison = {
      file1: { name: file1, model: result1.model, provider: result1.provider },
      file2: { name: file2, model: result2.model, provider: result2.provider },
      metrics: {
        avgSimilarity: {
          file1: result1.summary?.avgSimilarity || 0,
          file2: result2.summary?.avgSimilarity || 0,
          delta:
            (result1.summary?.avgSimilarity || 0) -
            (result2.summary?.avgSimilarity || 0)
        },
        successRate: {
          file1:
            result1.summary?.successCount / result1.summary?.totalTests || 0,
          file2:
            result2.summary?.successCount / result2.summary?.totalTests || 0
        },
        issuesCount: {
          file1: result1.summary?.issuesCount || 0,
          file2: result2.summary?.issuesCount || 0
        },
        avgDuration: {
          file1: result1.summary?.avgDuration || 0,
          file2: result2.summary?.avgDuration || 0
        }
      },
      perCaseComparison: []
    };

    // Compare per-case results if IDs match
    const results1Map = new Map((result1.results || []).map((r) => [r.id, r]));
    const results2Map = new Map((result2.results || []).map((r) => [r.id, r]));

    for (const [id, r1] of results1Map) {
      const r2 = results2Map.get(id);
      if (r2) {
        const sim1 = r1.evaluation?.similarity || 0;
        const sim2 = r2.evaluation?.similarity || 0;
        comparison.perCaseComparison.push({
          id,
          similarity: { file1: sim1, file2: sim2, delta: sim1 - sim2 },
          winner: sim1 > sim2 ? 'file1' : sim2 > sim1 ? 'file2' : 'tie'
        });
      }
    }

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── WebSocket Setup ───────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  logger.info({ clientId }, 'WS client connected');

  ws.clientId = clientId;
  wsHandler.handleConnection(ws);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      wsHandler.handleMessage(ws, message);
    } catch (error) {
      logger.warn({ err: error.message }, 'WS message parse error');
    }
  });

  ws.on('close', () => {
    logger.info({ clientId }, 'WS client disconnected');
    wsHandler.handleDisconnect(ws);
  });
});

// ── Serve viewer.html for root ────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'viewer.html'));
});

// ── Error Handling ────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  logger.error({ err: err.message, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start Server ──────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('  AntV Skills Evaluation Server');
  console.log('='.repeat(60));
  console.log(`  Server running at: http://localhost:${PORT}`);
  console.log(`  WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`  Mode: ${IS_DEV ? 'development' : 'production'}`);
  console.log('');
  console.log('  API Endpoints:');
  console.log(`    GET    /api/providers     - List AI providers`);
  console.log(`    GET    /api/datasets      - List test datasets`);
  console.log(`    GET    /api/results       - List result files`);
  console.log(`    GET    /api/results/:file - Get result JSON`);
  console.log(`    POST   /api/eval          - Start evaluation`);
  console.log(`    GET    /api/eval/:id      - Get eval status`);
  console.log(`    DELETE /api/eval/:id      - Cancel evaluation`);
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('='.repeat(60));
});

process.on('SIGINT', () => {
  logger.info('Server shutting down...');
  evalManager.stopAll();
  wss.close();
  server.close();
  process.exit(0);
});
