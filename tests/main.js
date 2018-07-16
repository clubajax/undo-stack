import chai from 'chai';
import UndoStack from '../src/UndoStack';

const expect = chai.expect;
const mocha = window.mocha;

mocha.setup('tdd');


suite('undo-stack', function () {

	test('test readme example', () => {
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
	});

	test.only('test readme example #2', () => {
		let data = { str: 'a' };
		const stack = new UndoStack(data, {
			onChange: function (o) {
				// important! update entire data object if/when changed
				data = o;
			},
			onStatus ({ undoable, redoable}) {
				console.log('undoable/redoable', undoable, redoable);
			},
			onSet (o, value, key, target) {

			}
		});
		data.str = 'ab';
		data.str = 'abc';
		console.log(data.str); // abc
		stack.undo();
		console.log(data.str); // ab
		stack.redo();
		console.log(data.str); // abc
	});

	test('test simple undo/redo', () => {
		const events = [];
		let data;
		const stack = new UndoStack({ s: 'a' }, {
			onSet: function (o) {
				data = o;
				// console.log(' - ', o.s);
				events.push(o.s);
			}
		});
		data.s = 'ab';
		data.s = 'abc';
		expect(stack.stack.length).to.equal(3);
		stack.undo();
		expect(stack.stack.length).to.equal(3);
		stack.redo();
		expect(stack.stack.length).to.equal(3);
		expect(stack.stack.length).to.equal(3);
		expect(events.join(',')).to.equal('a,ab,abc,ab,abc')
	});

	test('test undo/redo out of bounds', () => {
		const events = [];
		let redoable;
		let undoable;
		let data;
		const stack = new UndoStack({ s: 'a' }, {
			onSet: function (o) {
				data = o;
				// console.log(' - ', o.s);
				events.push(o.s);
			},
			onStatus: function (e) {
				redoable = e.redoable;
				undoable = e.undoable;
			}
		});
		expect(undoable).to.equal(false);
		data.s = 'ab';
		data.s = 'abc';
		expect(redoable).to.equal(false);
		expect(undoable).to.equal(true);
		expect(stack.stack.length).to.equal(3);

		stack.undo();
		stack.undo();
		stack.undo();
		stack.undo();
		stack.undo();
		expect(redoable).to.equal(true);
		expect(undoable).to.equal(false);

		stack.redo();
		stack.redo();
		stack.redo();
		stack.redo();
		stack.redo();
		expect(redoable).to.equal(false);
		expect(undoable).to.equal(true);
		expect(events.join(',')).to.equal('a,ab,abc,ab,a,ab,abc');
	});

	test('test truncate stack', () => {
		const events = [];
		let data;
		const stack = new UndoStack({ s: 'a' }, {
			onSet: function (o) {
				data = o;
				// console.log(' - ', o.s);
				events.push(o.s);
			}
		});
		data.s = 'ab';
		data.s = 'abc';
		data.s = 'abcd';
		expect(stack.stack.length).to.equal(4);
		stack.undo();
		stack.undo();
		expect(stack.stack.length).to.equal(4);
		data.s = data.s + 'z';
		expect(stack.stack.length).to.equal(3);
	});

	test('test deep changes', () => {
		const aEvents = [];
		const oEvents = [];
		const events = [];
		let data;
		const stack = new UndoStack({
			a: [1, 2, {
				x:9
			}]
		}, {
			onSet: function (o, value, key, target) {
				data = o;
				// console.log(' - ', o, value, key, target);
				if (Array.isArray(target)) {
					aEvents.push(value)
				} else if (typeof target === 'object') {
					oEvents.push(value);
				} else {
					events.push(value);
				}
			}
		});

		data.a[0] = 12;
		data.a[0] = 123;
		data.a[1] = 23;
		data.a[1] = 234;

		data.a[2].x = 98;
		data.a[2].x = 987;

		console.log(aEvents.join(','));
		console.log(oEvents.join(','));

		expect(aEvents.join(',')).to.equal('12,123,23,234');
		expect(oEvents.join(',')).to.equal('98,987');

		expect(data.a[1]).to.equal(234);
		expect(data.a[2].x).to.equal(987);
		stack.undo();
		expect(data.a[2].x).to.equal(98);
		stack.undo();
		expect(data.a[2].x).to.equal(9);
		expect(data.a[1]).to.equal(234);
		stack.undo();
		expect(data.a[1]).to.equal(23);
		stack.undo();
		expect(data.a[1]).to.equal(2);


		console.log('stack.stack', stack.stack);
	});

	test('it should only onChange for objects and onSet for all', () => {
		const changes = [];
		const sets = [];
		let data;
		const stack = new UndoStack({
			a: [1, 2],
			o: { x: 1 },
			n: 1
		}, {
			onChange: function (o, value, key, target) {
				data = o;
				if (target === undefined) {
					return;
				}
				changes.push(1);
			},
			onSet (o, value, key, target) {
				if (target === undefined) {
					return;
				}
				sets.push(1)
			}
		});

		data.n = 11;
		data.a[0] = 22;
		data.o.x = 33;
		data.o = { different: 'object'};

		console.log('changes', changes.join(','));
		console.log('sets', sets.join(','));

		expect(changes.join(',')).to.equal('1');
		expect(sets.join(',')).to.equal('1,1,1,1');

	});
});

mocha.run();

if (module.hot) {
	module.hot.dispose(function () {
		// module is about to be replaced
	});

	module.hot.accept(function () {
		// module or one of its dependencies was just updated
		document.location.reload()
	});
}