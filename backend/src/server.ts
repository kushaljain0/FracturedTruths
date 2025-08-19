import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';

const app = express();
app.use(cors());
app.use(express.json());

// Basic health endpoint
app.get('/health', (_req: Request, res: Response) => {
	res.status(200).json({ ok: true });
});

// Minimal API placeholders
app.post('/api/sessions', (_req, res) => {
	// TODO: create a session
	res.json({ sessionId: 'demo-session' });
});

app.post('/api/sessions/:sessionId/join', (_req, res) => {
	// TODO: join session and return token
	res.json({ playerId: 'p1', token: 'demo-token' });
});

app.get('/api/sessions/:sessionId/players/:playerId/view', (_req, res) => {
	// TODO: return derived overlay for player
	res.json({ turnIndex: 0, overlay: { intro: 'Welcome' }, ui: { actions: [] } });
});

app.post('/api/sessions/:sessionId/actions', (_req, res) => {
	// TODO: accept action
	res.json({ accepted: true });
});

const server = http.createServer(app);

// WebSocket server for realtime sync
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
	ws.send(JSON.stringify({ type: 'hello', message: 'Connected to Fractured Truths WS' }));
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on http://localhost:${PORT}`);
});


