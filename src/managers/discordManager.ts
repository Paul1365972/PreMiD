import { Client } from "discord-rpc";
import { app } from "electron";
import { info, success, error } from "../util/debug";

//* Import custom types
import PresenceData from "../../@types/PreMiD/PresenceData";
import { trayManager } from "..";
import { socket } from "./socketManager";

export let rpcClients: Array<RPCClient> = [];

class RPCClient {
	clientId: string;
	currentPresence: PresenceData;
	client: Client;
	clientReady: boolean = false;
	registered: boolean = false;

	constructor(clientId: string) {
		rpcClients.push(this);

		this.clientId = clientId;
		//TODO this.registered = app.setAsDefaultProtocolClient(`discord-${clientId}`);
		if (this.registered) {
			success(`Registered PreMiD as default client for "discord-${clientId}"`)
		}
		this.client = new Client({
			transport: "ipc"
		});

		this.client.once("ready", () => {
			this.clientReady = true;
			this.setActivity();
		});
		this.client.once(
			// @ts-ignore
			"disconnected",
			() =>
				(rpcClients = rpcClients.filter(
					client => client.clientId !== this.clientId
				))
		);

		this.client.login({clientId: this.clientId})
			.then((client) => {
				client.subscribe('ACTIVITY_JOIN', (secret) => {
					info(`ACTIVITY_JOIN: '${secret}'`);
					socket.emit("activityJoin", { clientId: this.clientId, secret: secret });
				});
				client.subscribe('ACTIVITY_SPECTATE', (secret) => {
					// Doesnt work (yet)
					info(`ACTIVITY_SPECTATE: '${secret}'`);
					socket.emit("activitySpectate", { clientId: this.clientId, secret: secret });
				});
				client.subscribe('ACTIVITY_JOIN_REQUEST', (user) => {
					// For some random reason not called
					info(`ACTIVITY_JOIN_REQUEST: '${user}'`);
					this.client.sendJoinInvite(user)
						.then(() => success("Successfully sent invite"),
							(e) => error("Unable to sent invite: " + e));
				});
				client.subscribe('ACTIVITY_INVITE', (obj) => {
					// Not yet tested
					info(`ACTIVITY_INVITE: '${obj}'`);
				});
				client.subscribe('GAME_JOIN', (obj) => {
					// Not yet tested
					info(`GAME_JOIN: '${obj}'`);
				});
				client.subscribe('GAME_SPECTATE', (obj) => {
					// Not yet tested
					info(`GAME_SPECTATE: '${obj}'`);
				});
				client.subscribe('NOTIFICATION_CREATE', (obj) => {
					// Not yet tested
					info(`NOTIFICATION_CREATE: '${obj}'`);
				});
				success("Subscribed");
			}).catch((e) => {
			    error("Error: " + e);
				this.destroy();
			});

		info(`Create RPC client (${this.clientId})`);
	}

	setActivity(presenceData?: PresenceData) {
		presenceData = presenceData ? presenceData : this.currentPresence;

		if (!this.clientReady || !presenceData) return;

		if (presenceData.trayTitle)
			trayManager.tray.setTitle(presenceData.trayTitle);

		presenceData.presenceData.matchSecret = "subx2";
		presenceData.presenceData.spectateSecret = "subx3";
		presenceData.presenceData.joinSecret = "subx4";
		// discord-rpc... why just why
		// @ts-ignore
		presenceData.presenceData.partyId = "subx5";
		presenceData.presenceData.partySize = 1;
		presenceData.presenceData.partyMax = 1337;

		this.client
			.setActivity(presenceData.presenceData)
			.catch(() => this.destroy());
		info("setActivity");
	}

	clearActivity() {
		this.currentPresence = null;

		if (!this.clientReady) return;

		this.client.clearActivity().catch(() => this.destroy());
		trayManager.tray.setTitle("");
	}

	async destroy() {
		try {
			info(`Destroy RPC client (${this.clientId})`);
			if (this.clientReady) {
				this.client.clearActivity();
				this.client.destroy();
			}

			trayManager.tray.setTitle("");
			rpcClients = rpcClients.filter(
				client => client.clientId !== this.clientId
			);
		} catch (err) {}
	}
}

/**
 * Sets the user's activity
 * @param presence PresenceData to set activity
 */
export function setActivity(presence: PresenceData) {
	let client = rpcClients.find(c => c.clientId === presence.clientId);

	if (!client) {
		client = new RPCClient(presence.clientId);
		client.currentPresence = presence;
	} else client.setActivity(presence);
}

/**
 * Clear a user's activity
 * @param clientId clientId of presence to clear
 */
export function clearActivity(clientId: string = undefined) {
	info("clearActivity");

	if (clientId) {
		let client = rpcClients.find(c => c.clientId === clientId);
		client.clearActivity();
	} else rpcClients.forEach(c => c.clearActivity());
}

export function checkoutActivity(clientId: string = undefined) {
	let client = rpcClients.find(c => c.clientId === clientId);

	if (!client) {
		client = new RPCClient(clientId);
	}
}

export async function getDiscordUser() {
	return new Promise((resolve, reject) => {
		const c = new Client({ transport: "ipc" });

		c.login({
			clientId: "503557087041683458"
		})
			.then(({ user }) => c.destroy().then(() => resolve(user)))
			.catch(reject);
	});
}

app.once(
	"will-quit",
	async () => await Promise.all(rpcClients.map(c => c.destroy()))
);
