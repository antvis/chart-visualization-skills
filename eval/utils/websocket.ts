/**
 * WebSocket Handler — real-time evaluation progress updates.
 */

import type { WebSocket, WebSocketServer } from 'ws';
import type EvaluationManager from './eval-manager.js';

interface EvalResult {
  id: string;
  evaluation?: { similarity?: number; hasIssues?: boolean };
  duration?: number;
}

export default class WebSocketHandler {
  private wss: WebSocketServer;
  private evalManager: EvaluationManager;
  private clients = new Map<string, { ws: WebSocket & { clientId: string }; subscriptions: Set<string> }>();

  constructor(wss: WebSocketServer, evalManager: EvaluationManager) {
    this.wss = wss;
    this.evalManager = evalManager;
  }

  handleConnection(ws: WebSocket & { clientId: string }) {
    this.clients.set(ws.clientId, { ws, subscriptions: new Set() });
    this.send(ws, { type: 'connected', clientId: ws.clientId, message: 'Connected to evaluation server' });
  }

  handleMessage(ws: WebSocket & { clientId: string }, message: { type: string; payload: Record<string, string> }) {
    const { type, payload } = message;
    const client = this.clients.get(ws.clientId);
    if (!client) return;

    switch (type) {
      case 'subscribe':
        if (payload.evalId) {
          client.subscriptions.add(payload.evalId);
          this.send(ws, { type: 'subscribed', evalId: payload.evalId });
          const status = this.evalManager.getStatus(payload.evalId);
          if (status) this.send(ws, { type: 'eval:status', evalId: payload.evalId, status });
        }
        break;
      case 'unsubscribe':
        if (payload.evalId) {
          client.subscriptions.delete(payload.evalId);
          this.send(ws, { type: 'unsubscribed', evalId: payload.evalId });
        }
        break;
      case 'ping':
        this.send(ws, { type: 'pong' });
        break;
    }
  }

  handleDisconnect(ws: WebSocket & { clientId: string }) {
    this.clients.delete(ws.clientId);
  }

  send(ws: WebSocket, message: Record<string, unknown>) {
    if (ws.readyState === 1) ws.send(JSON.stringify(message));
  }

  broadcast(evalId: string, message: Record<string, unknown>) {
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(evalId)) this.send(client.ws, { ...message, evalId });
    }
  }

  onEvalStart(evalId: string, options: unknown) {
    this.broadcast(evalId, { type: 'eval:start', evalId, options, timestamp: new Date().toISOString() });
  }

  onEvalProgress(evalId: string, current: number, total: number, result: EvalResult) {
    this.broadcast(evalId, {
      type: 'eval:progress',
      evalId,
      current,
      total,
      progress: current / total,
      result: { id: result.id, similarity: result.evaluation?.similarity, hasIssues: result.evaluation?.hasIssues, duration: result.duration },
      timestamp: new Date().toISOString()
    });
  }

  onEvalComplete(evalId: string, summary: unknown, outputPath: string) {
    this.broadcast(evalId, { type: 'eval:complete', evalId, summary, outputPath, timestamp: new Date().toISOString() });
  }

  onEvalError(evalId: string, error: Error) {
    this.broadcast(evalId, { type: 'eval:error', evalId, error: error.message, timestamp: new Date().toISOString() });
  }

  onEvalCancelled(evalId: string) {
    this.broadcast(evalId, { type: 'eval:cancelled', evalId, timestamp: new Date().toISOString() });
  }

  getClientCount() {
    return this.clients.size;
  }
}
