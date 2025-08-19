import { fetch } from 'undici';
import type { LlmAdapter } from './adapter';
import type { LlmNarrator, CanonicalEvent } from './narrator';
import type { Player } from '../repo/types';

type GenerateContentResponse = {
	candidates?: Array<{
		content?: { parts?: Array<{ text?: string }> };
	}>;
};

export class GeminiClient {
	private readonly apiKey: string;
	constructor(apiKey: string) {
		if (!apiKey) throw new Error('GEMINI_API_KEY is required');
		this.apiKey = apiKey;
	}

	async generateContent(model: string, prompt: string): Promise<string> {
		const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
			model,
		)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
		const body = {
			contents: [
				{
					parts: [{ text: prompt }],
				},
			],
		};
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			const txt = await res.text().catch(() => '');
			throw new Error(`Gemini error ${res.status}: ${txt}`);
		}
		const data = (await res.json()) as GenerateContentResponse;
		const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
		return text;
	}
}

export class GeminiLlmAdapter implements LlmAdapter {
	private readonly client: GeminiClient;
	private readonly model: string;
	constructor(params: { apiKey: string; model?: string }) {
		this.client = new GeminiClient(params.apiKey);
		this.model = params.model ?? 'gemini-1.5-flash';
	}

	async generatePlayerOverlay(input: {
		playerId: string;
		displayName: string;
		entities: Array<{ id: string; kind: string; data: Record<string, unknown> }>;
		factions: Array<{ id: string; name: string; data: Record<string, unknown> }>;
	}): Promise<Record<string, unknown>> {
		const prompt = this.buildOverlayPrompt(input);
		const raw = await this.client.generateContent(this.model, prompt);
		try {
			const jsonStart = raw.indexOf('{');
			const jsonEnd = raw.lastIndexOf('}');
			const jsonText = jsonStart >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;
			const parsed = JSON.parse(jsonText);
			return parsed;
		} catch {
			return { brief: `Welcome ${input.displayName}`, rumors: [], visibleEntities: [] };
		}
	}

	private buildOverlayPrompt(input: {
		playerId: string;
		displayName: string;
		entities: Array<{ id: string; kind: string; data: Record<string, unknown> }>;
		factions: Array<{ id: string; name: string; data: Record<string, unknown> }>;
	}): string {
		const entities = input.entities
			.slice(0, 10)
			.map((e) => ({ id: e.id, kind: e.kind }))
			.map((e) => `- ${e.id} (${e.kind})`)
			.join('\n');
		const factions = input.factions
			.slice(0, 10)
			.map((f) => `- ${f.id} (${f.name})`)
			.join('\n');
		return [
			'You are a narrative assistant for a multiplayer asymmetric knowledge game.',
			'Generate a short JSON overlay for a single player. The overlay MUST be valid JSON with keys:',
			'- brief: string',
			'- rumors: array of { factionId: string, note: string }',
			'- visibleEntities: array of { id: string, kind: string }',
			"Do not include prose outside the JSON.",
			`Player: ${input.displayName} (${input.playerId})`,
			`Factions:\n${factions || '- none'}`,
			`Entities:\n${entities || '- none'}`,
		].join('\n');
	}
}

export class GeminiNarrator implements LlmNarrator {
	private readonly client: GeminiClient;
	private readonly model: string;
	constructor(params: { apiKey: string; model?: string }) {
		this.client = new GeminiClient(params.apiKey);
		this.model = params.model ?? 'gemini-1.5-flash';
	}

	async composeNarratives(
		evt: CanonicalEvent,
		players: Array<Pick<Player, 'id' | 'displayName' | 'alignment'>>,
	): Promise<Record<string, string>> {
		const results: Record<string, string> = {};
		for (const p of players) {
			const prompt = this.buildNarrativePrompt(evt, p);
			const raw = await this.client.generateContent(this.model, prompt);
			const text = raw.trim().replace(/^\s+|\s+$/g, '');
			results[p.id] = text;
		}
		return results;
	}

	private buildNarrativePrompt(
		evt: CanonicalEvent,
		player: Pick<Player, 'id' | 'displayName' | 'alignment'>,
	): string {
		const stance =
			player.alignment === 'tyrannical'
				? 'Frame events as demonstrations of order and strength. Downplay suffering.'
			: player.alignment === 'corrupt_chancellor'
				? 'Frame events as opportunities for personal gain and political leverage.'
				: 'Frame events with empathy; emphasize impacts on common folk and mercy.';
		return [
			'Write a single-sentence narrative (max 25 words) for a player in a social deduction game.',
			`Event: ${evt.description}`,
			`Player: ${player.displayName} (${player.id})`,
			`Style: ${stance}`,
			'No JSON. No preface. Output only the sentence.',
		].join('\n');
	}
}


