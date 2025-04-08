import type {Options} from "./spincheck";
import Loop from "./Loop";

let _id = 0;

function nextId() {
	return ++_id;
}

function addInitialiser(loop: Loop, path) {
	let nodes = loop.getInitialiser();
	
	for (let node of nodes) {
		path.insertBefore(node);
	}
}

function addIncrementAndCheck(loop: Loop, path) {
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
			
			max = Number(match[1]);
			
			return false;
		},
	});
	
	return max;
}

// map loop bodies to Loops so we can find the Loop/
// that a string literal is inside for "spincheck(a, b, c)"; expressions
let loopMap = new Map();

/*
add the initialiser (counter and debug info vars) and check

debug statements ("spincheck(a, b, c)";) are converted in a separate step
*/

function processLoop(path) {
	let max = getMax(path.node.test);
	
	if (max === null) {
		return;
	}
	
	let loop = new Loop(options, nextId(), max);
	
	loopMap.set(path.node.body, loop);
	
	addInitialiser(loop, path);
	addIncrementAndCheck(loop, path);
}

export default function processLoops(ast): void {
	recast.visit(ast, {
		visitWhileStatement(path) {
			processLoop(path);
			
			this.traverse(path);
		},
		
		visitDoWhileStatement(path) {
			processLoop(path);
			
			this.traverse(path);
		},
		
		// replace "spincheck(a, b, c)"; statements with logs
		
		visitExpressionStatement(path) {
			let {expression} = path.node;
			
			if (expression.type !== "StringLiteral") {
				return false;
			}
			
			let str = expression.value;
			let match = str.match(/^spincheck\(([\w\s,]+)\)$/);
			
			if (match) {
				let debugInfo = match[1];
				
				let parent = path.parent;
				let loop = null;
				
				while (parent) {
					if (loopMap.has(parent.node)) {
						loop = loopMap.get(parent.node);
						
						break;
					}
					
					parent = parent.parent;
				}
				
				if (loop) {
					path.replace(loop.getDebugRecorder(debugInfo));
					
					return false;
				}
			}
			
			this.traverse(path);
		},
	});
}
