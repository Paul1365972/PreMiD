import "source-map-support/register";

import { app } from "electron";
import { init as initSocket } from "./managers/socketManager";
import { update as initAutoLaunch } from "./managers/launchManager";
import { platform } from "os";
import { checkForUpdate } from "./util/updateChecker";
import { TrayManager } from "./managers/trayManager";
import * as Sentry from "@sentry/electron";
import commandLineArgs from "command-line-args";
import { info } from "./util/debug";
import { checkoutActivity } from "./managers/discordManager";

if (app.isPackaged)
	Sentry.init({
		dsn:
			"https://c11e044610da45b7a4dc3bac6c006037@o357239.ingest.sentry.io/5193608"
	});
export let trayManager: TrayManager;

//* Define and set it to null
//* Set AppUserModelId for task manager etc
//* When app is ready
export let updateCheckerInterval = null;

info(`Starting with args: '${process.argv.join(" ")}'`);

const optionDefinitions = [
	{ name: 'checkout', alias: 'c', type: String, defaultOption: true },
	{ name: 'multiple-instances', alias: 'm', type: Boolean },
	{ name: 'port', alias: 'p', type: Number, defaultValue: 3020 },
];
export let options = commandLineArgs(optionDefinitions, { argv: process.argv.slice(app.isPackaged ? 1 : 2), camelCase: true });

if (options.checkout) {
	const matches = /^discord-([0-9]+):\/\/.*$/.exec(options.checkout);
	const id = (matches && matches.length == 2) ? matches[1] : options.checkout;
	checkoutActivity(id);
	setTimeout(app.quit, 15 * 1000);
} else {
	//* Attempt to get lock to prevent multiple instances of PreMiD from running
    //* Application already running?
	if (!app.requestSingleInstanceLock() && !options.multipleInstances) {
		info("Quitting! Application is already running. Use the '--multiple-instances' flag to bypass");
		app.quit();
		process.exit(1);
	}

	app.setAppUserModelId("Timeraa.PreMiD");
	app.whenReady().then(async () => {
		trayManager = new TrayManager();

		await Promise.all([checkForUpdate(true), initAutoLaunch(), initSocket()]);

		app.isPackaged
			? (updateCheckerInterval = setInterval(checkForUpdate, 15 * 60 * 1000))
			: undefined;
		if (platform() === "darwin") app.dock.hide();
	});
}
