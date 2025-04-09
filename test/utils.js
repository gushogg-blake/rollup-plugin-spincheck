import {rollup} from "rollup";
import spincheck from "../src/index.js";

let _moduleId = 0;

export async function createModule() {
	let name = "output_" + (++_moduleId) + ".js";
	
	let bundle = await rollup({
		input: "test/fixtures/input.js",
		
		plugins: [
			spincheck({
				debug: false,
				prompt: false,
			}),
		],
	});
	
	await bundle.write({
		format: "es",
		file: "test/fixtures/" + name,
	});
	
	return await import("./fixtures/" + name);
}
