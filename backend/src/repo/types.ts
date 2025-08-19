export interface Entity {
	id: string;
	kind: string;
	data: Record<string, unknown>;
}

export interface Faction {
	id: string;
	name: string;
	data: Record<string, unknown>;
}

export interface Player {
	id: string;
	displayName: string;
	alignment?: 'merciful' | 'tyrannical' | 'corrupt_chancellor';
}

export interface OverlayView {
	playerId: string;
	view: Record<string, unknown>;
	updatedAt: Date;
}

export interface GameEvent {
	id: string;
	playerId?: string;
	type: string;
	payload: Record<string, unknown>;
	createdAt: Date;
}

export interface GameRepository {
	// canonical state
	listEntities(): Promise<Entity[]>;
	listFactions(): Promise<Faction[]>;
	upsertEntity(entity: Entity): Promise<void>;
	appendEvent(evt: GameEvent): Promise<void>;
	listPlayers(): Promise<Player[]>;

	// players & overlays
	createPlayer(displayName: string, alignment?: Player['alignment']): Promise<Player>;
	getPlayer(playerId: string): Promise<Player | undefined>;
	getOverlay(playerId: string): Promise<OverlayView | undefined>;
	setOverlay(playerId: string, view: Record<string, unknown>): Promise<void>;
}


