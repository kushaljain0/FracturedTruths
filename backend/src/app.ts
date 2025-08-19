import express from 'express';
import cors from 'cors';
import type { GameRepository } from './repo/types';
import type { LlmAdapter } from './llm/adapter';
import type { LlmNarrator, CanonicalEvent } from './llm/narrator';
import { randomUUID } from 'crypto';

export function createApp(deps: { repo: GameRepository; llm: LlmAdapter; narrator?: LlmNarrator; broadcast?: (event: unknown) => void }) {
	const { repo, llm, narrator, broadcast } = deps;
	const app = express();
	app.use(cors());
	app.use(express.json());

	app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

	// POST /join → create player with custom LLM-generated view
	app.post('/join', async (req, res) => {
		const displayName = String(req.body?.displayName ?? '').trim();
		const alignment = (req.body?.alignment as any | undefined);
		if (!displayName) return res.status(400).json({ error: 'displayName required' });

		const player = await repo.createPlayer(displayName, alignment);
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
		const event = {
			id: randomUUID(),
			playerId,
			type,
			payload: payload ?? {},
			createdAt: new Date(),
		};
		await repo.appendEvent(event);

		// naive canonical update: ensure a heartbeat entity exists
		await repo.upsertEntity({ id: 'world:heartbeat', kind: 'world', data: { lastAction: type } });

		// regenerate this player's overlay
		const entities = await repo.listEntities();
		const factions = await repo.listFactions();
		const overlay = await llm.generatePlayerOverlay({ playerId, displayName: player.displayName, entities, factions });
		await repo.setOverlay(playerId, overlay);

		// optional narrator fan-out narratives
		if (narrator) {
			const players = await repo.listPlayers();
			const evt: CanonicalEvent = { type, description: payload?.description ?? type, payload };
			const narratives = await narrator.composeNarratives(
				evt,
				players.map((p) => ({ id: p.id, displayName: p.displayName, alignment: p.alignment })),
			);
			for (const [pid, text] of Object.entries(narratives)) {
				const existing = await repo.getOverlay(pid);
				await repo.setOverlay(pid, { ...(existing?.view ?? {}), narrative: text });
			}

			broadcast?.({
				type: 'narratives',
				byPlayer: narratives,
				event,
			});
		}

		return res.status(200).json({ ok: true });
	});

	return app;
}


