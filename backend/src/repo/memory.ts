import { randomUUID } from 'crypto';
import { Entity, Faction, GameEvent, GameRepository, OverlayView, Player } from './types';

export class InMemoryGameRepository implements GameRepository {
	private entities: Map<string, Entity> = new Map();
	private factions: Map<string, Faction> = new Map();
	private players: Map<string, Player> = new Map();
	private overlays: Map<string, OverlayView> = new Map();
	private events: GameEvent[] = [];

	async listEntities(): Promise<Entity[]> {
		return Array.from(this.entities.values());
	}

	async listFactions(): Promise<Faction[]> {
		return Array.from(this.factions.values());
	}

	async upsertEntity(entity: Entity): Promise<void> {
		this.entities.set(entity.id, entity);
	}

	async appendEvent(evt: GameEvent): Promise<void> {
		this.events.push(evt);
	}

	async createPlayer(displayName: string): Promise<Player> {
		const player: Player = { id: randomUUID(), displayName };
		this.players.set(player.id, player);
		return player;
	}

	async getPlayer(playerId: string): Promise<Player | undefined> {
		return this.players.get(playerId);
	}

	async getOverlay(playerId: string): Promise<OverlayView | undefined> {
		return this.overlays.get(playerId);
	}

	async setOverlay(playerId: string, view: Record<string, unknown>): Promise<void> {
		this.overlays.set(playerId, { playerId, view, updatedAt: new Date() });
	}
}


