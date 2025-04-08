export function noCheck(n) {
	let i = 0;
	
	while (i <= 1000) {
		i++;
		
		if (i === n) {
			break;
		}
	}
	
	return i;
}

export function singleWhile_1000(n) {
	let i = 0;
	
	while ("spincheck=1000") {
		i++;
		
		if (i === n) {
			break;
		}
	}
	
	return i;
}

export function singleDoWhile_1000(n) {
	let i = 0;
	
	do {
		i++;
		
		if (i === n) {
			break;
		}
	} while ("spincheck=1000");
	
	return i;
}

export function nestedWhiles_10_20(n1, n2) {
	let a = 0;
	let b = 0;
	
	while ("spincheck=10") {
		a++;
		
		if (a === n1) {
			break;
		}
		
		while (b < n2 && "spincheck=20") {
			b++;
		}
	}
	
	return {a, b};
}
