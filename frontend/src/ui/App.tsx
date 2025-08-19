import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type Alignment = 'merciful' | 'tyrannical' | 'corrupt_chancellor';

export default function App() {
	const [connected, setConnected] = useState(false);
	const [playerId, setPlayerId] = useState<string | null>(null);
	const [displayName, setDisplayName] = useState('');
	const [alignment, setAlignment] = useState<Alignment>('merciful');
	const [narrative, setNarrative] = useState<string>('');
	const [lastEvent, setLastEvent] = useState<string>('');
	const socketRef = useRef<WebSocket | null>(null);

	const wsUrl = useMemo(() => {
		const proto = location.protocol === 'https:' ? 'wss' : 'ws';
		return `${proto}://${location.hostname}:3000/ws`;
	}, []);

	useEffect(() => {
		const ws = new WebSocket(wsUrl);
		socketRef.current = ws;
		ws.onopen = () => setConnected(true);
		ws.onclose = () => setConnected(false);
		ws.onmessage = (evt) => {
			try {
				const msg = JSON.parse(evt.data);
				if (msg.type === 'narratives' && playerId) {
					if (msg.byPlayer[playerId]) setNarrative(msg.byPlayer[playerId]);
					if (msg.event?.payload?.description) setLastEvent(String(msg.event.payload.description));
				}
			} catch {
				/* ignore non-json */
			}
		};
		return () => ws.close();
	}, [wsUrl, playerId]);

	async function join(e: FormEvent) {
		e.preventDefault();
		const res = await fetch('http://localhost:3000/join', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ displayName, alignment }),
		});
		const data = await res.json();
		setPlayerId(data.playerId);
		const pv = await fetch(`http://localhost:3000/view/${data.playerId}`);
		const pvData = await pv.json();
		if (pvData.view?.narrative) setNarrative(pvData.view.narrative);
	}

	async function act(type: 'support' | 'rebel' | 'investigate') {
		if (!playerId) return;
		const payload =
			type === 'support'
				? { description: 'Citizens rally to the King' }
			: type === 'rebel'
				? { description: 'Whispers of rebellion in the tavern' }
				: { description: 'Investigations uncover a corrupt chancellor' };
		await fetch('http://localhost:3000/action', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playerId, type: 'policy_change', payload }),
		});
		// immediate pull
		const pv = await fetch(`http://localhost:3000/view/${playerId}`);
		const pvData = await pv.json();
		if (pvData.view?.narrative) setNarrative(pvData.view.narrative);
	}

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 p-6">
			<h1 className="text-2xl font-semibold">Fractured Truths</h1>
			<p className="mt-2 text-sm opacity-80">WS: {connected ? 'connected' : 'disconnected'}</p>

			{!playerId ? (
				<form className="mt-6 space-y-3 max-w-sm" onSubmit={join}>
					<div>
						<label className="block text-sm mb-1">Display name</label>
						<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" placeholder="Your name" />
					</div>
					<div>
						<label className="block text-sm mb-1">Alignment</label>
						<select value={alignment} onChange={(e) => setAlignment(e.target.value as Alignment)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700">
							<option value="merciful">Merciful</option>
							<option value="tyrannical">Tyrannical</option>
							<option value="corrupt_chancellor">Corrupt Chancellor</option>
						</select>
					</div>
					<button className="px-4 py-2 bg-emerald-600 rounded">Join</button>
				</form>
			) : (
				<div className="mt-6 grid gap-6 md:grid-cols-2">
					<div className="space-y-3">
						<h2 className="font-medium">Your Narrative</h2>
						<div data-testid="narrative-box" className="p-4 rounded bg-slate-900 border border-slate-800 min-h-[6rem] whitespace-pre-wrap">{narrative || 'No narrative yet.'}</div>
					</div>
					<div className="space-y-3">
						<h2 className="font-medium">Actions</h2>
						<div className="flex gap-3">
							<button onClick={() => act('support')} className="px-3 py-2 rounded bg-blue-600">Support King</button>
							<button onClick={() => act('rebel')} className="px-3 py-2 rounded bg-rose-600">Rebel</button>
							<button onClick={() => act('investigate')} className="px-3 py-2 rounded bg-amber-600">Investigate</button>
						</div>
						<div className="text-sm opacity-80">Last Event: {lastEvent || '—'}</div>
						<div className="text-xs opacity-70">Tip: Have multiple browsers join with different alignments to see contradictory narratives.</div>
					</div>
				</div>
			)}
		</div>
	);
}


