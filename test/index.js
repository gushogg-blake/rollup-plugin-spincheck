import {suite, test, before} from "node:test";
import assert from "node:assert";
import {throwMessage} from "../src/constants.js";
import {createModule} from "./utils.js";

suite("spincheck", async function() {
	suite("breakMethod = throw", function() {
		let module;
		
		before(async function() {
			module = await createModule("throw");
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
	});
	
	suite("breakMethod = break", function() {
		let module;
		
		before(async function() {
			module = await createModule("break");
		});
		
		test("single while", async function() {
			let under = module.singleWhile_1000(1000);
			
			assert.equal(under, 1000);
			
			let over = module.singleWhile_1000(1200);
			
			assert.equal(over, 1001);
		});
		
		test("single do-while", async function() {
			let under = module.singleDoWhile_1000(1000);
			
			assert.equal(under, 1000);
			
			let over = module.singleDoWhile_1000(1200);
			
			assert.equal(over, 1001);
		});
		
		test("nested whiles", async function() {
			let under = module.nestedWhiles_10_20(10, 20);
			
			assert.equal(under.a, 10);
			assert.equal(under.b, 20);
			
			let over = module.nestedWhiles_10_20(11, 30);
			
			assert.equal(over.a, 11);
			assert.equal(over.b, 30);
		});
	});
});
