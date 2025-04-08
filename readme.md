# rollup-plugin-spincheck

Debug infinite loops without freezing.

Spincheck adds a check at the end of `while` and `do-while` loops to break out of them if the number of iterations exceeds a per-loop threshold.

## Features

Spincheck tries to make it as easy as possible to start debugging with useful information as soon as a potential infinite loop is detected:

- With the `debug` option on (the default) and dev tools open, you'll be dropped straight into a debugger session when a check is triggered.

- With `prompt` (off by default), you can prompt the user to break or continue.

- With `"spincheck(var1, var2, ...)";` annotations you can collect context/debug info for 3 iterations before breaking. These will be logged to the console, so will be available even if you didn't have dev tools open beforehand.

## Usage

### Annotations in code

To use Spincheck, include a string of the form `"spincheck=N"` in the loop condition, where `N` is the maximum number of iterations to allow.

Example:

```typescript
while ("spincheck=1000") {
    // this loop will break/throw after 1000 iterations
}

while (someCondition && "spincheck=1000") {
    // this loop will break/throw after 1000 iterations
}
```

You can also include `"spincheck(var1, var2, ...)";` expression statements to collect debug information for 3 iterations before breaking.

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

This will generate an array of 3 `{first, last, current}` objects before breaking.

Since the annotations are just strings, your code is still valid and logically equivalent (since strings are truthy) if spincheck isn't applied for some reason.

### Options

```typescript
export type Options = {
    // list of file extensions to scan.
    // defaults to [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]
    extensions: string[];
    
    // whether to include a debugger; statement before throwing/breaking out of the loop
    // defaults to true
    debug?: boolean;
    
    // whether to show a confirm() dialog for the user to decide whether
    // to let the loop continue for another round (up to the threshold,
    // at which point another check will be triggered)
    // defaults to false
    prompt?: boolean;
    
    // whether to break (potentially allowing code to continue from
    // wherever the loop got to), or throw an error
    // defaults to "throw"
    breakMethod?: "break" | "throw";
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
        // transfoms such as typescript, commonjs, etc
        
        spincheck({
            // options
        }),
    ],
    
    // ...
};
```

## Purpose

When writing complex algorithms it's often required to search a tree or do some other kind of iteration where infinite loops are possible. In these cases a freeze is the least desirable result, as it's usually impossible to know which part of the code is in an infinite loop.

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

Spincheck adds this boilerplate---along with a handful of other nifty features---at build time, to keep your code cleaner, smaller, and easier to maintain.

## Performance

### Runtime

Spincheck adds initialisers for a counter variable and a debug array above every annotated loop and uses lightweight constructs to trigger the break, so shouldn't have a meaningful impact on performance. No function calls are made until the break point and nothing is added to the array until 3 loops before the breakpoint.

### Build time

The plugin does a simple string search for `spincheck=` in every module before processing it in order to avoid parsing overhead in files that don't have any annotated loops. For modules with (potential) annotated loops, the transform is done using [recast](https://github.com/benjamn/recast).

## Transform example

### Options

```javascript
{
    debug: true,
    prompt: true,
    breakMethod: "throw",
}
```

### Input

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

### Output

```javascript
function singleWhile_1000(n) {
    let i = 0;

    let __spincheck_counter_1 = 0;
    let __spincheck_debug_1 = [];

    while ("spincheck=1000") {
        i++;

        if (__spincheck_counter_1 > 997) {
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
        // not used -- just to prevent illegal break statement
        __spincheck_counter_1++;

        if (__spincheck_counter_1 > 1000) {
            debugger;
            
            let o = {};
            Error.captureStackTrace(o);
            let {stack} = o;
            
            console.log("Possible infinite loop\n");
            console.log("Debug info from last 3 loops:\n");
            console.log(__spincheck_debug_1);
            
            if (confirm("Possible infinite loop detected after 1000 iterations. Continue?\n\nStack trace:\n\n" + stack)) {
                __spincheck_counter_1 = 0;
            } else {
                throw new Error("spincheck: breaking out of possible infinite loop");
            }
        }
    }

    return i;
}
```
