export type LlmProvider = 'mock' | 'gemini';

export interface AppConfig {
	llmProvider: LlmProvider;
	narrativesEnabled: boolean;
	geminiApiKey?: string;
	geminiModel?: string;
}

export function loadConfig(env = process.env): AppConfig {
	const llm = (env.LLM_PROVIDER as LlmProvider) || 'mock';
	const enabled = env.NARRATIVES_ENABLED ? env.NARRATIVES_ENABLED === 'true' : true;
	return {
		llmProvider: llm,
		narrativesEnabled: enabled,
		geminiApiKey: env.GEMINI_API_KEY,
		geminiModel: env.GEMINI_MODEL,
	};
}


