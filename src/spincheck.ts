import * as recast from "recast";
import * as parser from "recast/parsers/babel.js";
import {createFilter} from "@rollup/pluginutils";
import processLoops from "./processLoops";

export type Options = {
	extensions: string[];
	debug?: boolean;
	prompt?: boolean;
	breakMethod?: "break" | "throw";
};

export default function(options: Partial<Options> = {}) {
	options = {
		extensions: [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"],
		debug: true,
		prompt: false,
		breakMethod: "throw",
		...options,
	};
	
	let include = options.extensions.map(s => "**/*" + s);
	let filter = createFilter(include);
	
	return {
		name: "spincheck",
		
		transform(code: string, id: string) {
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
			
			processLoops(ast);
			
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
