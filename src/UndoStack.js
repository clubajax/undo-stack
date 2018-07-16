const nodash = require('@clubajax/no-dash');
const proxify  = require('@clubajax/proxify');

class UndoStack {

	constructor (data, options = {}) {
		this.undoable = false;
		this.redoable = false;
		this.stack = [];
		this.stackIndex = -1;
		if (options.onChange) {
			this.onChange = options.onChange;
		}
		if (options.onSet) {
			this.onSet = options.onSet;
		}
		if (options.onStatus) {
			this.onStatus = options.onStatus;
		}
		if (data) {
			this.data = data;
		}
	}

	set data (data) {
		this._data = proxify(nodash.copy(data), {
			onChange: this.update.bind(this)
		});
		this.update();
	}

	get data () {
		return this._data;
	}

	undo () {
		if (this.stackIndex > 0) {
			this.isMovingStackIndex = true;
			this.stackIndex--;
			this.data = this.stack[this.stackIndex];
			this.isMovingStackIndex = false;
		}
	}

	redo () {
		if (this.stackIndex <= this.stack.length - 2) {
			this.isMovingStackIndex = true;
			this.stackIndex++;
			this.data = this.stack[this.stackIndex];
			this.isMovingStackIndex = false;
		}
	}

	onSet (data, value, key, target) {
		// overwrite me!
	}

	onChange (data, value, key, target) {
		// overwrite me!
	}

	onStatus ({ undoable, redoable }) {
		// overwrite me!
	}

	update (value, key, target) {
		// private!
		if (!this.isMovingStackIndex) {
			if (this.stackIndex < this.stack.length - 1) {
				// the stack backed up with undo, then set new data
				this.stack = this.stack.slice(0, this.stackIndex + 1);
			}
			this.stack.push(nodash.copy(this.data));
			this.stackIndex++;
		}

		this.updateStatus();

		if (value === undefined || typeof value === 'object') {
			this.onChange(this.data, value, key, target);
		}

		this.onSet(this.data, value, key, target);
	}

	updateStatus () {
		const wasUndoable = this.undoable;
		const wasRedoable = this.redoable;
		this.undoable = this.stackIndex > 0;
		this.redoable = this.stackIndex <= this.stack.length - 2;
		if (wasUndoable === this.undoable && wasRedoable === this.redoable) {
			// no change
			return;
		}
		this.onStatus({
			undoable: this.undoable,
			redoable: this.redoable
		});
	}
}

module.exports = UndoStack;
