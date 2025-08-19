import http from 'http';
import { WebSocketServer } from 'ws';
import { createApp } from './app';
import { InMemoryGameRepository } from './repo/memory';
import { StubLlmAdapter } from './llm/adapter';
import { MockLlmNarrator } from './llm/narrator';

// Simple WS broadcast wiring
const wssClients = new Set<import('ws').WebSocket>();
const app = createApp({
	repo: new InMemoryGameRepository(),
	llm: new StubLlmAdapter(),
	narrator: new MockLlmNarrator(),
	broadcast: (event: unknown) => {
		const data = JSON.stringify(event);
		for (const ws of wssClients) {
			if (ws.readyState === ws.OPEN) ws.send(data);
		}
	},
});
const server = http.createServer(app);

// WebSocket server for realtime sync (kept for future broadcast hooks)
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
	wssClients.add(ws);
	ws.send(JSON.stringify({ type: 'hello', message: 'Connected to Fractured Truths WS' }));
	ws.on('close', () => wssClients.delete(ws));
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on http://localhost:${PORT}`);
});


