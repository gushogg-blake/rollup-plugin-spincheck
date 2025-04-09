import * as recast from "recast";
//import type {Options} from "./spincheck";
import Loop from "./Loop.js";

let _id = 0;

function nextId() {
	return ++_id;
}

function addInitialiser(loop, path) {
	let nodes = loop.getInitialiser();
	
	for (let node of nodes) {
		path.insertBefore(node);
	}
}

function addIncrementAndCheck(loop, path) {
	let nodes = loop.getIncrementAndCheck();
	
	for (let node of nodes) {
		path.get("body", "body").push(node);
	}
}

/*
parse the max from the "spincheck=N" condition
*/

function getMax(node) {
	let max = null;
	
	recast.visit(node, {
		visitStringLiteral(path) {
			let str = path.node.value;
			let match = str.match(/^spincheck\s*=\s*(\d+)$/);
			
			if (!match) {
				return false;
			}
			
			max = recast.parse(match[1]).program.body[0].expression;
			
			return false;
		},
		
		visitTemplateLiteral(path) {
			let {expressions, quasis} = path.node;
			
			if (
				quasis.length !== 2
				|| !quasis[0].value.raw.match(/^spincheck\s*=\s*/)
				|| quasis[1].value.raw !== ""
				|| expressions.length !== 1
			) {
				return false;
			}
			
			max = expressions[0];
			
			return false;
		},
	});
	
	return max;
}

// map loop bodies to Loops so we can find the Loop
// that a string literal is inside for "spincheck(a, b, c)"; expressions
let loopMap = new Map();

/*
add the initialiser (counter and debug info vars) and check

debug statements ("spincheck(a, b, c)";) are converted in a separate step
*/

function processLoop(options, path) {
	let max = getMax(path.node.test);
	
	if (max === null) {
		return;
	}
	
	let loop = new Loop(options, nextId(), max);
	
	loopMap.set(path.node.body, loop);
	
	addInitialiser(loop, path);
	addIncrementAndCheck(loop, path);
}

function findAnnotatedLoopAncestor(path) {
	while (path) {
		if (loopMap.has(path.node)) {
			return loopMap.get(path.node);
		}
		
		path = path.parent;
	}
	
	return null;
}

function convertStringToLog(path) {
	let {expression} = path.node;
	let str = expression.value;
	let match = str.match(/^spincheck\(([\w\s,]+)\)$/);
	
	if (match) {
		let loop = findAnnotatedLoopAncestor(path.parent);
		
		if (loop) {
			let ast = recast.parse("({" + match[1] + "})");
			let debugExpression = ast.program.body[0].expression;
			
			path.replace(loop.getDebugRecorder(debugExpression));
			
			return true;
		}
	}
	
	return false;
}

function convertTemplateToLog(path) {
	let {expressions, quasis} = path.node.expression;
	
	if (
		quasis.length !== 2
		|| quasis[0].value.raw !== "spincheck("
		|| quasis[1].value.raw !== ")"
		|| expressions.length !== 1
	) {
		return false;
	}
	
	let value = expressions[0];
	let loop = findAnnotatedLoopAncestor(path.parent);
	
	if (loop) {
		path.replace(loop.getDebugRecorder(value));
		
		return true;
	}
	
	return false;
}

export default function processLoops(options, ast) {
	recast.visit(ast, {
		visitWhileStatement(path) {
			processLoop(options, path);
			
			this.traverse(path);
		},
		
		visitDoWhileStatement(path) {
			processLoop(options, path);
			
			this.traverse(path);
		},
		
		// convert "spincheck(a, b, c)"; and `spincheck(${{a, b, c}})`; statements
		
		visitExpressionStatement(path) {
			let {expression} = path.node;
			
			if (expression.type === "StringLiteral") {
				if (convertStringToLog(path)) {
					return false;
				}
			} else if (expression.type === "TemplateLiteral") {
				if (convertTemplateToLog(path)) {
					return false;
				}
			}
			
			this.traverse(path);
		},
	});
}
