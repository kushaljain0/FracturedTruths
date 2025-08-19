import request from 'supertest';
import { createApp } from '../src/app';
import { InMemoryGameRepository } from '../src/repo/memory';
import { StubLlmAdapter } from '../src/llm/adapter';

function makeApp() {
	const repo = new InMemoryGameRepository();
	// seed some factions/entities for overlay content
	// @ts-ignore access private for test setup
	repo['factions'].set('f1', { id: 'f1', name: 'Wardens', data: {} });
	// @ts-ignore
	repo['entities'].set('e1', { id: 'e1', kind: 'npc', data: { name: 'Guard' } });
	return createApp({ repo, llm: new StubLlmAdapter() });
}

describe('API', () => {
	it('POST /join creates a player and overlay', async () => {
		const app = makeApp();
		const res = await request(app).post('/join').send({ displayName: 'Alice' });
		expect(res.status).toBe(201);
		expect(res.body.playerId).toBeDefined();
	});

	it('GET /view/:playerId returns player-specific view', async () => {
		const app = makeApp();
		const join = await request(app).post('/join').send({ displayName: 'Bob' });
		const pid = join.body.playerId as string;
		const view = await request(app).get(`/view/${pid}`).send();
		expect(view.status).toBe(200);
		expect(view.body.playerId).toBe(pid);
		expect(view.body.view).toBeDefined();
	});

	it('POST /action appends event and updates overlay', async () => {
		const app = makeApp();
		const join = await request(app).post('/join').send({ displayName: 'Cara' });
		const pid = join.body.playerId as string;
		const act = await request(app).post('/action').send({ playerId: pid, type: 'observe', payload: { target: 'gate' } });
		expect(act.status).toBe(200);
		const view = await request(app).get(`/view/${pid}`);
		expect(view.status).toBe(200);
	});
});


