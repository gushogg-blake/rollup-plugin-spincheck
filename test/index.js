import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import {rollup} from "rollup";
import loopmax from "../src/index.js";

test("test", async function() {
	let dir = "test/fixtures/valid";
	let expectedOutput = fs.readFileSync(dir + "/output.js").toString();
	
	let bundle = await rollup({
		input: dir + "/input.js",
		plugins: [loopmax()],
	});
	
	let result = await bundle.generate({
		format: "cjs",
	});
	
	//console.log(expectedOutput);
	
	console.log(result.output[0].code);
	//assert.equal(result.output[0].code, expectedOutput);
});
