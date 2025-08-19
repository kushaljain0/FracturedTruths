import type { Player } from '../repo/types';

export type CanonicalEvent = {
	type: string; // e.g., 'policy_change'
	description: string; // e.g., 'King raises tax'
	payload?: Record<string, unknown>;
};

export interface LlmNarrator {
	composeNarratives(
		evt: CanonicalEvent,
		players: Array<Pick<Player, 'id' | 'displayName' | 'alignment'>>,
	): Promise<Record<string, string>>; // playerId -> narrative
}

export class MockLlmNarrator implements LlmNarrator {
	async composeNarratives(
		evt: CanonicalEvent,
		players: Array<Pick<Player, 'id' | 'displayName' | 'alignment'>>,
	): Promise<Record<string, string>> {
		const map: Record<string, string> = {};
		for (const p of players) {
			const stance = p.alignment ?? 'merciful';
			let tone: string;
			switch (stance) {
				case 'merciful':
					tone = `A burden on the poor; seek relief.`;
					break;
				case 'tyrannical':
					tone = `A show of strength; dissent will fade.`;
					break;
				case 'corrupt_chancellor':
					tone = `An opportunity; coffers swell for those in favor.`;
					break;
				default:
					tone = `A change is decreed.`;
			}
			map[p.id] = `${evt.description} — ${tone}`;
		}
		return map;
	}
}


