import { useEffect, useMemo, useRef, useState } from 'react';

export default function App() {
	const [connected, setConnected] = useState(false);
	const [messages, setMessages] = useState<string[]>([]);
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
		ws.onmessage = (evt) => setMessages((m) => [...m, evt.data]);
		return () => ws.close();
	}, [wsUrl]);

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 p-6">
			<h1 className="text-2xl font-semibold">Fractured Truths</h1>
			<p className="mt-2 text-sm opacity-80">Connection: {connected ? 'connected' : 'disconnected'}</p>
			<div className="mt-6 space-y-2">
				<h2 className="font-medium">Server messages</h2>
				<ul className="text-sm list-disc pl-5">
					{messages.map((m, i) => (
						<li key={i}>{m}</li>
					))}
				</ul>
			</div>
		</div>
	);
}


