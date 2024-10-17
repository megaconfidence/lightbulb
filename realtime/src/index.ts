import { DurableObject } from 'cloudflare:workers';

export class RealTime extends DurableObject {
	storage: DurableObjectStorage;
	sessions: Map<WebSocket, any>;
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.sessions = new Map();
		this.ctx.getWebSockets().forEach((ws) => {
			this.sessions.set(ws, { ...ws.deserializeAttachment() });
		});
	}
	async fetch(_req: Request) {
		const pair = new WebSocketPair();
		this.ctx.acceptWebSocket(pair[1]);
		this.sessions.set(pair[1], {});
		return new Response(null, { status: 101, webSocket: pair[0] });
	}
	broadcast(sender: WebSocket, msg: string | object) {
		for (let [ws] of this.sessions) {
			if (sender == ws) continue;
			switch (typeof msg) {
				case 'string':
					ws.send(msg);
					break;
				default:
					ws.send(JSON.stringify(msg));
					break;
			}
		}
	}
	close(ws: WebSocket) {
		const session = this.sessions.get(ws);
		if (!session?.id) return;
		this.broadcast(ws, { type: 'left' });
		this.sessions.delete(ws);
	}
	webSocketMessage(ws: WebSocket, msg: string) {
		this.broadcast(ws, msg);
	}
	webSocketClose(ws: WebSocket) {
		this.close(ws);
	}
	webSocketError(ws: WebSocket) {
		this.close(ws);
	}
}

export default {
	async fetch(request, env, _ctx): Promise<Response> {
		if (request.headers.get('Upgrade') != 'websocket') {
			return new Response('Expected upgrade to websocket', { status: 426 });
		}
		let id: DurableObjectId = env.REAL_TIME.idFromName(new URL(request.url).pathname);
		let realTime = env.REAL_TIME.get(id);
		return realTime.fetch(request);
	},
} satisfies ExportedHandler<Env>;
