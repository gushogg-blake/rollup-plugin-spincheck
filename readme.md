# rollup-plugin-spincheck

Debug infinite loops without freezing.

Spincheck adds a check at the end of `while` and `do-while` loops to break out of them if the number of iterations exceeds a per-loop threshold.

## Features

Spincheck tries to make it as easy as possible to start debugging with useful information as soon as a potential infinite loop is detected:

- With the `debug` option on (the default) and dev tools open, you'll be dropped straight into a debugger session when a check is triggered.

- With `prompt` (off by default), you can prompt the user to break or continue.

- With `"spincheck(var1, var2, ...)";` annotations you can collect context/debug info for three iterations before breaking. These will be logged to the console, so will be available even if you didn't have dev tools open beforehand.

## Usage

### Annotations in code

To use Spincheck, include a string of the form `"spincheck=N"` in the loop condition, where `N` is the maximum number of iterations to allow.

Example:

```typescript
while ("spincheck=1000") {
    // this loop will throw after 1001 iterations
}

while (someCondition && "spincheck=1000") {
    // this loop will throw after 1001 iterations
}

do {
    // this loop will throw after 1001 iterations
} while (someCondition && "spincheck=1000");

while (true) {
    // this loop will not be modified
}
```

#### Dynamic expressions

A dynamic max iterations value can be specified with a template literal:

```javascript
while (`spincheck=${inputSize * 10}`) {
    // this loop's max iterations depends on the input size
}
```

Dynamic `spincheck=${max}` expressions can use any value that's in scope for the while condition. They will be assigned to a `const` just before the loop, and will only be evaluated once.

**Note:** If you are using TypeScript, the compiler may complain about regular strings always being truthy. Template strings aren't affected as of version 5.8.2, so you can use a template string with a constant expression to avoid this error: `spincheck=${1000}`.

### Logs

You can include `"spincheck(var1, var2, ...)";` expression statements to collect debug information for three iterations before breaking.

The provided variables will be converted to an object and added to an array, which will be logged to the console.

Example:

```typescript
while ("spincheck=1000") {
    let first;
    let last;
    let current;
    
    // ... logic ...
    
    "spincheck(first, last, current)";
}
```

This will generate an array of three `{first, last, current}` objects before breaking.

Since the annotations are just strings, your code is still valid and logically equivalent (since strings are truthy) if Spincheck isn't applied for some reason.

Log annotations also support template literals, in which case a single expression must be provided:

```typescript
while ("spincheck=1000") {
    let first;
    let last;
    let current;
    
    // ... logic ...
    
    `spincheck(${{first, last, current}})`;
}
```

In either case, the expression is parsed at build time to ensure syntactical correctness and the log call is wrapped in a try-catch to guard against reference errors.

### Options

```typescript
export type Options = {
    // list of file extensions to scan.
    // if you use TypeScript, make sure to keep the .ts extensions
    // as the module IDs seen by the plugin will still have .ts extensions.
    // defaults to [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]
    extensions?: string[];
    
    // whether to include a debugger; statement before breaking
    // defaults to true
    debug?: boolean;
    
    // whether to show a confirm() dialog for the user to decide whether
    // to let the loop continue for another round (up to the threshold,
    // at which point another check will be triggered)
    // defaults to false
    prompt?: boolean;
};
```

### Example Rollup config

```javascript
// rollup.config.js

import spincheck from "rollup-plugin-spincheck";

export default {
    // ...
    
    plugins: [
        // spincheck should come at the end of most JS
        // transforms such as typescript, commonjs, etc
        
        spincheck({
            // options
        }),
    ],
    
    // ...
};
```

## Purpose

When writing complex algorithms it's often required to search a tree or do some other kind of iteration where infinite loops are possible. In these cases a freeze is the least desirable result, as it's usually impossible even to know which part of the code is in an infinite loop.

To address this, I found myself writing things like:

```javascript
let i = 0;

while (true) {
    if (i > 1000) {
        console.log("Infinite");
        
        break;
    }
    
    // algorithm...
    
    i++;
}
```

Spincheck adds this boilerplate---along with a handful of other nifty features---at build time to save on typing and remove noise from the source code.

## Performance

### Runtime

Spincheck adds initialisers for a counter variable and a debug array above every annotated loop and uses lightweight constructs to trigger the break, so shouldn't have a meaningful impact on performance. No function calls are made until the break point and nothing is added to the array until three loops before the break point.

### Build time

The plugin does a simple string search for `spincheck` in every module before processing it in order to avoid parsing overhead in files that don't have any annotated loops. For modules with annotated loops, the transform is done using [recast](https://github.com/benjamn/recast).

## Transform example

Options:

```javascript
{
    debug: true,
    prompt: true,
}
```

Input:

```typescript
export function singleWhile_1000(n) {
    let i = 0;
    
    while ("spincheck=1000") {
        i++;
        
        "spincheck(i)";
        
        if (i === n) {
            break;
        }
    }
    
    return i;
}
```

Output:

```javascript
function singleWhile_1000(n) {
    let i = 0;

    const __spincheck_max_1 = 1000;
    const __spincheck_debug_1 = [];
    let __spincheck_counter_1 = 0;

    while ("spincheck=1000") {
        i++;

        if (__spincheck_counter_1 > __spincheck_max_1 - 3) {
            try {
                __spincheck_debug_1.push({i});
            } catch (e) {
                console.log("spincheck: error encountered when trying to add debug info:");
                console.error(e);
            }
        }

        if (i === n) {
			break;
		}
        __spincheck_counter_1++;

        if (__spincheck_counter_1 > __spincheck_max_1) {
            debugger;
            
            const o = {};
            Error.captureStackTrace(o);
            const {stack} = o;
            
            console.log("Possible infinite loop\n");
            console.log("Debug info from last three loops:\n");
            console.log(__spincheck_debug_1);
            
            if (confirm("Possible infinite loop detected after " + __spincheck_max_1 + " iterations. Continue?\n\nStack trace:\n\n" + stack)) {
                __spincheck_counter_1 = 0;
            } else {
                throw new Error("spincheck: breaking out of possible infinite loop");
            }
        }
    }

    return i;
}
```
