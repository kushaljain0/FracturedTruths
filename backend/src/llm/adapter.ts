export interface LlmAdapter {
	generatePlayerOverlay(input: {
		playerId: string;
		displayName: string;
		entities: Array<{ id: string; kind: string; data: Record<string, unknown> }>;
		factions: Array<{ id: string; name: string; data: Record<string, unknown> }>;
	}): Promise<Record<string, unknown>>;
}

// MVP stub: deterministic overlay for testing
export class StubLlmAdapter implements LlmAdapter {
	async generatePlayerOverlay(input: {
		playerId: string;
		displayName: string;
		entities: { id: string; kind: string; data: Record<string, unknown> }[];
		factions: { id: string; name: string; data: Record<string, unknown> }[];
	}): Promise<Record<string, unknown>> {
		return {
			brief: `Welcome ${input.displayName}`,
			rumors: input.factions.map((f) => ({ factionId: f.id, note: `${f.name} watches the roads.` })),
			visibleEntities: input.entities.slice(0, 1).map((e) => ({ id: e.id, kind: e.kind })),
		};
	}
}


