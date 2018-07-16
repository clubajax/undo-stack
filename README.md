# undo-stack

Keeps track of object changes, with undo and redo capability. 

## To Install

    yarn add @clubajax/undo-stack
    
or

    npm install @clubajax/undo-stack
    
`undo-stack` is (currently) unbuilt, and deployed in ES6. You would need to include this package within babel if compiling to older browsers.


## Example

```jsx harmony
let data = { str: 'a' };
const stack = new UndoStack(data, {
	onChange: function (o) {
		// important! update entire data object if/when changed
		data = o;
	}
});
data.str = 'ab';
data.str = 'abc';
console.log(data.str); // abc
stack.undo();
console.log(data.str); // ab
stack.redo();
console.log(data.str); // abc
```

The above example works by defining your object and making changes to a property, which is tracked.
A copy of the object is made on every change and placed in the undo stack.

When `undo` is invoked, the pointer of the stack changes, and the `onChange` method is called with the new object.
In your application, you might have to rerender with the new data.

To avoid render thrashing, `onChange` is only called when the main object or a sub-object changes, not for simple properties.
In the above example, it is only called on initialization, and for `undo` and `redo`. If you want a notification of every change,
use `onSet` (see below).

## Docs

Structure:
    
    const stack = new UndoStack(initialData, options);
    
* **stack:** An instance of UndoStack. Mainly used for calling `undo` and `redo`.
* **initialData:** The data which will be transformed into a listen-able object using [proxify](https://github.com/clubajax/proxify). 
 Note this **must** be an object or an array, and can't be a simple string, number, boolean, etc.
* **options:** Options for the UndoStack that will include callbacks:
  * **onChange(data, value, key, target):** Called every time the main object or a sub-object changes. 
    * **data:** You should replace your application data with the first argument on every change.
    * **value:** The value of the last change.
    * **key:** The property name of the last change. 
    * **target:** The sub-object (or main object) of the last change. 
  * **onSet(data, value, key, target):** Called every time a property changes. 
    * **data:** You could replace your application data with this, but it might happen too often.
    * **value:** The value of the last change.
    * **key:** The property name of the last change. 
    * **target:** The sub-object (or main object) of the last change.    
  * **onStatus({ undoable, redoable }):** Emits an event object with two boolean properties that indicate whether the stack is past
  the beginning (making it undoable), or before the end (making it redoable). This is only called when the status changes. 
   
## License

This uses the [MIT license](./LICENSE). Feel free to use, and redistribute at will.