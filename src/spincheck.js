import * as recast from "recast";
import * as parser from "recast/parsers/babel.js";
import {createFilter} from "@rollup/pluginutils";
import processLoops from "./processLoops.js";

//export type Options = {
//	extensions: string[];
//	debug?: boolean;
//	prompt?: boolean;
//};

export default function(options) {
	options = {
		extensions: [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"],
		debug: true,
		prompt: false,
		...options,
	};
	
	let include = options.extensions.map(s => "**/*" + s);
	let filter = createFilter(include);
	
	return {
		name: "spincheck",
		
		transform(code, id) {
			if (!filter(id)) {
				return;
			}
			
			// quick check to see if there are any loops to process
			// can avoid parsing if not
			if (!code.includes("spincheck=")) {
				return;
			}
			
			let ast = recast.parse(code, {
				parser,
				sourceFileName: id,
			});
			
			processLoops(options, ast);
			
			let {code: transformedCode, map} = recast.print(ast, {
				sourceMapName: id,
			});
			
			return {
				code: transformedCode,
				map,
			};
		},
	};
}
