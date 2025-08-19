export type SessionId = string;
export type PlayerId = string;

export interface PlayerView {
	turnIndex: number;
	overlay: Record<string, unknown>;
	ui: { actions: ActionSpec[] };
}

export interface ActionSpec {
	type: string;
	label?: string;
	payloadSchema?: Record<string, unknown>;
}


