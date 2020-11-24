//TODO import { app } from "electron";
//TODO if (!app.isPackaged) var chalk = require("chalk");

/**
 * Show info message in console
 * */
export function info(message: string) {
	//* Return if app packaged
	//* Show debug
	//if (app.isPackaged) return; TODO
	//console.log(`${chalk.bgBlue(chalk.white("  INFO   "))} ${message}`);
	console.log(`  INFO   ${message}`);
}

/**
 * Show success message in console
 * */
export function success(message: string) {
	//* Return if app packaged
	//* Show debug
	//if (app.isPackaged) return; TODO
	//console.log(`${chalk.bgGreen(" SUCCESS ")} ${message}`);
	console.log(` SUCCESS ${message}`);
}

/**
 * Show error message in console
 * */
export function error(message: string) {
	//* Return if app packaged
	//* Show debug
	//if (app.isPackaged) return; TODO
	//console.log(`${chalk.bgRed("  ERROR  ")} ${message}`);
	console.log(`  ERROR  ${message}`);
}
