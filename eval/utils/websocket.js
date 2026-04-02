/**
 * WebSocket Handler
 *
 * Handles WebSocket connections for real-time evaluation progress updates.
 */

class WebSocketHandler {
  constructor(wss, evalManager) {
    this.wss = wss;
    this.evalManager = evalManager;
    this.clients = new Map(); // clientId -> { ws, subscriptions }
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   */
  handleConnection(ws) {
    const clientId = ws.clientId;
    this.clients.set(clientId, {
      ws,
      subscriptions: new Set() // Evaluation IDs this client is subscribed to
    });

    // Send connection confirmation
    this.send(ws, {
      type: 'connected',
      clientId,
      message: 'Connected to evaluation server'
    });
  }

  /**
   * Handle WebSocket message
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} message - Parsed message object
   */
  handleMessage(ws, message) {
    const { type, payload } = message;
    const client = this.clients.get(ws.clientId);

    switch (type) {
      case 'subscribe':
        // Subscribe to evaluation updates
        if (payload.evalId) {
          client.subscriptions.add(payload.evalId);
          this.send(ws, {
            type: 'subscribed',
            evalId: payload.evalId
          });

          // Send current status if evaluation exists
          const status = this.evalManager.getStatus(payload.evalId);
          if (status) {
            this.send(ws, {
              type: 'eval:status',
              evalId: payload.evalId,
              status
            });
          }
        }
        break;

      case 'unsubscribe':
        if (payload.evalId) {
          client.subscriptions.delete(payload.evalId);
          this.send(ws, {
            type: 'unsubscribed',
            evalId: payload.evalId
          });
        }
        break;

      case 'ping':
        this.send(ws, { type: 'pong' });
        break;

      default:
        console.log(`[WS] Unknown message type: ${type}`);
    }
  }

  /**
   * Handle WebSocket disconnection
   * @param {WebSocket} ws - WebSocket connection
   */
  handleDisconnect(ws) {
    this.clients.delete(ws.clientId);
  }

  /**
   * Send message to a specific client
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} message - Message object
   */
  send(ws, message) {
    if (ws.readyState === 1) {
      // WebSocket.OPEN
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all subscribed clients
   * @param {string} evalId - Evaluation ID
   * @param {Object} message - Message object
   */
  broadcast(evalId, message) {
    for (const [clientId, client] of this.clients) {
      if (client.subscriptions.has(evalId)) {
        this.send(client.ws, { ...message, evalId });
      }
    }
  }

  /**
   * Broadcast to all connected clients
   * @param {Object} message - Message object
   */
  broadcastAll(message) {
    for (const [clientId, client] of this.clients) {
      this.send(client.ws, message);
    }
  }

  // ── Evaluation Event Handlers ───────────────────────────────────────────────

  /**
   * Called when evaluation starts
   * @param {string} evalId - Evaluation ID
   * @param {Object} options - Evaluation options
   */
  onEvalStart(evalId, options) {
    this.broadcast(evalId, {
      type: 'eval:start',
      evalId,
      options,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Called when a test case completes
   * @param {string} evalId - Evaluation ID
   * @param {number} current - Current test index
   * @param {number} total - Total tests
   * @param {Object} result - Test case result
   */
  onEvalProgress(evalId, current, total, result) {
    this.broadcast(evalId, {
      type: 'eval:progress',
      evalId,
      current,
      total,
      progress: current / total,
      result: {
        id: result.id,
        similarity: result.evaluation?.similarity,
        hasIssues: result.evaluation?.hasIssues,
        duration: result.duration
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Called when a test case result is ready (full result)
   * @param {string} evalId - Evaluation ID
   * @param {Object} result - Full test case result
   */
  onEvalResult(evalId, result) {
    this.broadcast(evalId, {
      type: 'eval:result',
      evalId,
      result,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Called when evaluation completes
   * @param {string} evalId - Evaluation ID
   * @param {Object} summary - Evaluation summary
   * @param {string} outputPath - Path to output file
   */
  onEvalComplete(evalId, summary, outputPath) {
    this.broadcast(evalId, {
      type: 'eval:complete',
      evalId,
      summary,
      outputPath,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Called when evaluation encounters an error
   * @param {string} evalId - Evaluation ID
   * @param {Error} error - Error object
   */
  onEvalError(evalId, error) {
    this.broadcast(evalId, {
      type: 'eval:error',
      evalId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Called when evaluation is cancelled
   * @param {string} evalId - Evaluation ID
   */
  onEvalCancelled(evalId) {
    this.broadcast(evalId, {
      type: 'eval:cancelled',
      evalId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected client count
   * @returns {number}
   */
  getClientCount() {
    return this.clients.size;
  }
}

module.exports = WebSocketHandler;
