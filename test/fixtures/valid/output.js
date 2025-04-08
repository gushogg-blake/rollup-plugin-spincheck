let middle = require("utils/middle");

/*
given a node and a cursor, find the smallest node within the given node
(or the node itself) that the cursor is either directly before or within

if the cursor is not directly before or within the given node, null is
returned.
*/

module.exports = function(node, cursor) {
	if (!node.containsCharCursor(cursor)) {
		return null;
	}
	
	let smallestNode = node;
	let {children} = smallestNode;
	let startIndex = 0;
	let endIndex = children.length;
	
	// shouldn't convert -- no loopmax string
	while (true) {
		if (endIndex - startIndex === 0) {
			break;
		}
		
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (child.containsCharCursor(cursor)) {
			smallestNode = child;
			children = smallestNode.children;
			startIndex = 0;
			endIndex = children.length;
		} else if (cursor.isBefore(child.start)) {
			endIndex = index;
		} else if (cursor.isOnOrAfter(child.end)) {
			startIndex = index + 1;
		}
	}
	
	// should convert -- has loopmax string
	let __loopmax_counter_1 = 0;
	let __loopmax_debug_info_1 = [];
	do {
		// test
		
		// @loopmax(a, b, c);
		__loopmax_counter_1++;
		
		if (__loopmax_counter_1 > 1000) {
			// record any debug info for the last 3 loops
			try {
				__loopmax_debug_info_1.push([a, b, c]);
			} catch (e) {
				console.log("loopmax: error encountered when trying to add debug info:");
				console.error(e);
			}
			
			if (__loopmax_counter_1 > 1003) {
				// if we have devtools open we can go straight into a debugger
				debugger;
				
				// otherwise throw an error or allow another round
				let o = {};
				
				Error.captureStackTrace(o, platform.loop);
				
				let {stack} = o;
				
				console.log("Possible infinite loop\n");
				console.log("Debug info from last 3 loops:\n");
				console.log(__loopmax_debug_info_1);
				
				if (confirm("Possible infinite loop detected after 1000 iterations. Continue?\n\nStack trace:\n\n" + stack)) {
					__loopmax_counter_1 = 0;
				} else {
					throw new Error("Breaking out of possible infinite loop");
				}
			}
		}
	} while("loopmax=1000");
	
	// shouldn't convert -- not interested in for loops
	for (let i = 0; i < asd; i++) {
		
	}
	
	return smallestNode;
}
