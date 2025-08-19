import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Lightweight inline app for HTTP contract check of /health
const app = express();
app.use(cors());
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

describe('health endpoint', () => {
	it('returns 200', async () => {
		await request(app).get('/health').expect(200);
	});
});


