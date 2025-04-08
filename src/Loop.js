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
	}
	
	// replace "spincheck(a, b, c)"; with __spincheck_debug_N.push({a, b, c});
	// wrap in if for perf and try-catch in case of bugs
	// we allow 3 loops before breaking to collect debug info
	
	getDebugRecorder(debugInfo) {
		return recast.parse(`
			if (${this.counterVar} > ${this.max - 3}) {
				try {
					${this.debugInfoVar}.push({${debugInfo}});
				} catch (e) {
					console.log("spincheck: error encountered when trying to add debug info:");
					console.error(e);
				}
			}
		`).program.body[0];
	}
	
	getInitialiser() {
		return recast.parse(`
			let ${this.counterVar} = 0;
			let ${this.debugInfoVar} = [];
		`).program.body;
	}
	
	getIncrementAndCheck() {
		let {options, id, max, counterVar, debugInfoVar} = this;
		
		return recast.parse(`
			while (false) { // not used -- just to prevent illegal break statement
				${counterVar}++;
				
				if (${counterVar} > ${max}) {
					${options.debug ? `debugger;` : ""}
					
					let o = {};
					Error.captureStackTrace(o);
					let {stack} = o;
					
					console.log("Possible infinite loop\\n");
					console.log("Debug info from last 3 loops:\\n");
					console.log(${debugInfoVar});
					
					if (${JSON.stringify(options.prompt)} && confirm("Possible infinite loop detected after ${max} iterations. Continue?\\n\\nStack trace:\\n\\n" + stack)) {
						${counterVar} = 0;
					} else {
						${
							options.breakMethod === "throw"
							? `throw new Error("${throwMessage}");`
							: `break;`
						}
					}
				}
			}
		`).program.body[0].body.body;
	}
}
