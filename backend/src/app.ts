import express from 'express';
import cors from 'cors';
import type { GameRepository } from './repo/types';
import type { LlmAdapter } from './llm/adapter';
import { randomUUID } from 'crypto';

export function createApp(deps: { repo: GameRepository; llm: LlmAdapter }) {
	const { repo, llm } = deps;
	const app = express();
	app.use(cors());
	app.use(express.json());

	app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

	// POST /join → create player with custom LLM-generated view
	app.post('/join', async (req, res) => {
		const displayName = String(req.body?.displayName ?? '').trim();
		if (!displayName) return res.status(400).json({ error: 'displayName required' });

		const player = await repo.createPlayer(displayName);
		const entities = await repo.listEntities();
		const factions = await repo.listFactions();
		const overlay = await llm.generatePlayerOverlay({ playerId: player.id, displayName, entities, factions });
		await repo.setOverlay(player.id, overlay);

		return res.status(201).json({ playerId: player.id });
	});

	// GET /view/:playerId → return player-specific view of world state
	app.get('/view/:playerId', async (req, res) => {
		const { playerId } = req.params;
		const player = await repo.getPlayer(playerId);
		if (!player) return res.status(404).json({ error: 'player not found' });
		const overlay = await repo.getOverlay(playerId);
		return res.json({ playerId, displayName: player.displayName, view: overlay?.view ?? {} });
	});

	// POST /action → apply action, update canonical + player views
	app.post('/action', async (req, res) => {
		const { playerId, type, payload } = req.body ?? {};
		if (!playerId || !type) return res.status(400).json({ error: 'playerId and type required' });
		const player = await repo.getPlayer(playerId);
		if (!player) return res.status(404).json({ error: 'player not found' });

		// For MVP: record an event and upsert a generic entity change
		await repo.appendEvent({
			id: randomUUID(),
			playerId,
			type,
			payload: payload ?? {},
			createdAt: new Date(),
		});

		// naive canonical update: ensure a heartbeat entity exists
		await repo.upsertEntity({ id: 'world:heartbeat', kind: 'world', data: { lastAction: type } });

		// regenerate this player's overlay (others ignored for MVP)
		const entities = await repo.listEntities();
		const factions = await repo.listFactions();
		const overlay = await llm.generatePlayerOverlay({ playerId, displayName: player.displayName, entities, factions });
		await repo.setOverlay(playerId, overlay);

		return res.status(200).json({ ok: true });
	});

	return app;
}


