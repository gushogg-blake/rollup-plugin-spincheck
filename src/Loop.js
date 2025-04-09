import * as recast from "recast";
import {throwMessage} from "./constants.js";
//import type {Options} from "./spincheck";

/*
object representing a do/while loop with helpers for generating
the code to insert
*/

export default class Loop {
	// plugin options
	//options: Options;
	
	// id to create unique variable names
	//id: number;
	
	// max iterations this loop is allowed
	//max: number;
	
	//private counterVar: string;
	//private debugInfoVar: string;
	
	constructor(options, id, max) {
		this.options = options;
		this.id = id;
		this.max = max;
		
		this.counterVar = `__spincheck_counter_${id}`;
		this.debugInfoVar = `__spincheck_debug_${id}`;
		this.maxVar = `__spincheck_max_${id}`;
	}
	
	// replace "spincheck(a, b, c)"; with __spincheck_debug_N.push({a, b, c});
	// wrap in if for perf and try-catch in case of bugs
	// we allow 3 loops before breaking to collect debug info
	
	getDebugRecorder(debugInfo) {
		let ast = recast.parse(`
			if (${this.counterVar} > ${this.maxVar} - 3) {
				try {
					${this.debugInfoVar}.push("placeholder");
				} catch (e) {
					console.log("spincheck: error encountered when trying to add debug info:");
					console.error(e);
				}
			}
		`);
		
		recast.visit(ast, {
			visitLiteral(path) {
				if (path.node.value === "placeholder") {
					path.replace(debugInfo);
				}
				
				return false;
			},
		});
		
		return ast.program.body[0];
	}
	
	getInitialiser() {
		let {max} = this;
		
		let ast = recast.parse(`
			let ${this.maxVar} = "placeholder_max";
			let ${this.counterVar} = 0;
			let ${this.debugInfoVar} = [];
		`);
		
		recast.visit(ast, {
			visitLiteral(path) {
				if (path.node.value === "placeholder_max") {
					path.replace(max);
				}
				
				return false;
			},
		});
		
		return ast.program.body;
	}
	
	getIncrementAndCheck() {
		let {options, id, maxVar, counterVar, debugInfoVar} = this;
		
		// while loop not used -- just required to parse code with
		// a break statement
		return recast.parse(`
			while (false) {
				${counterVar}++;
				
				if (${counterVar} > ${maxVar}) {
					${options.debug ? `debugger;` : ""}
					
					let o = {};
					Error.captureStackTrace(o);
					let {stack} = o;
					
					console.log("Possible infinite loop\\n");
					console.log("Debug info from last three loops:\\n");
					console.log(${debugInfoVar});
					
					if (${JSON.stringify(options.prompt)} && confirm("Possible infinite loop detected after " + ${maxVar} + " iterations. Continue?\\n\\nStack trace:\\n\\n" + stack)) {
						${counterVar} = 0;
					} else {
						throw new Error("${throwMessage}");
					}
				}
			}
		`).program.body[0].body.body;
	}
}
