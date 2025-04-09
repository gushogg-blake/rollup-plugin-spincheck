import {suite, test, before} from "node:test";
import assert from "node:assert";
import {throwMessage} from "../src/constants.js";
import {createModule} from "./utils.js";

suite("spincheck", async function() {
	let module;
	
	before(async function() {
		module = await createModule();
	});
	
	test("single while", async function() {
		assert.doesNotThrow(function() {
			let result = module.singleWhile_1000(900);
			
			assert.equal(result, 900);
		});
		
		assert.throws(function() {
			module.singleWhile_1000(1200);
		}, {
			message: throwMessage,
		});
	});
	
	test("single do-while", async function() {
		assert.doesNotThrow(function() {
			let result = module.singleDoWhile_1000(900);
			
			assert.equal(result, 900);
		});
		
		assert.throws(function() {
			module.singleDoWhile_1000(1200);
		}, {
			message: throwMessage,
		});
	});
	
	test("nested whiles", async function() {
		assert.doesNotThrow(function() {
			let {a, b} = module.nestedWhiles_10_20(9, 19);
			
			assert.equal(a, 9);
			assert.equal(b, 19);
		});
		
		assert.throws(function() {
			module.nestedWhiles_10_20(10, 30);
		}, {
			message: throwMessage,
		});
	});
	
	test("dynamic max", async function() {
		assert.doesNotThrow(function() {
			let n = module.dynamic_10xInput(10, 100);
			
			assert.equal(n, 100);
		});
		
		assert.throws(function() {
			module.dynamic_10xInput(10, 102);
		}, {
			message: throwMessage,
		});
	});
});
