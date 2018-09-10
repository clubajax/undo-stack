import chai from 'chai';
import helper from './helper';
import UndoStack from '../src/UndoStack';

const expect = chai.expect;
const mocha = window.mocha;

helper(chai);

mocha.setup('tdd');


suite('undo-stack', function () {

	test('test pause and unpause', () => {
		let data = [{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }, { a: 5 }];
		let events = 0;
		const stack = new UndoStack(data, {
			paused: true,
			onChange: function (o, a, b) {
				events++;
				data = o;
			}
		});
		data.push({ a: 6 });
		data.push({ a: 7 });

		// always emits initial data, whether or not paused
		expect(events).to.equal(1);
		expect(data.length).to.equal(7);


		// paused - no event, but data is changed
		data.splice(0, 1);
		expect(events).to.equal(1);
		expect(data.length).to.equal(6);

		stack.unpause();
		data.shift();
		// multiple events because of the array operation
		expect(events).to.equal(6);
		expect(data.length).to.equal(5);

		stack.pause();
		data.shift();
		// unpause and trigger a change
		stack.unpause(true);
		expect(events).to.equal(7);
		expect(data.length).to.equal(4);
	});

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
		stack.undo();
		stack.redo();
	});

	test('test readme example #2', () => {
		let data = { str: 'a' };
		const stack = new UndoStack(data, {
			onChange: function (o) {
				// important! update entire data object if/when changed
				data = o;
			},
			onStatus ({ undoable, redoable }) {
				console.log('undoable/redoable', undoable, redoable);
			},
			onSet (o, value, key, target) {

			}
		});
		data.str = 'ab';
		data.str = 'abc';
		stack.undo();
		stack.redo();
	});

	test('test simple undo/redo', () => {
		const events = [];
		let data;
		const stack = new UndoStack({ s: 'a' }, {
			onSet: function (o) {
				data = o;
				console.log(' - ', o.s);
				events.push(o.s);
			}
		});
		data.s = 'ab';
		data.s = 'abc';
		expect(stack.length).to.equal(3);
		stack.undo();
		expect(stack.length).to.equal(3);
		stack.redo();
		expect(stack.length).to.equal(3);
		expect(stack.length).to.equal(3);
		expect(events.join(',')).to.equal('a,ab,abc,ab,abc')
	});

	test('test undo/redo out of bounds', () => {
		const events = [];
		let redoable = false;
		let undoable = false;
		let data;
		const stack = new UndoStack({ s: 'a' }, {
			onSet: function (o) {
				data = o;
				console.log(' - ', o.s);
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
		expect(stack.length).to.equal(3);

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

		expect(stack.length).to.equal(2);

		data.s = 'ab';
		data.s = 'abc';
		data.s = 'abcd';
		expect(stack.length).to.equal(4);
		stack.undo();
		stack.undo();
		expect(stack.length).to.equal(4);
		data.s = data.s + 'z';
		expect(stack.length).to.equal(3);
	});

	test('test deep changes', () => {
		const aEvents = [];
		const oEvents = [];
		const events = [];
		let data;
		const stack = new UndoStack({
			a: [1, 2, {
				x: 9
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
		data.o = { different: 'object' };

		console.log('changes', changes.join(','));
		console.log('sets', sets.join(','));

		expect(changes.join(',')).to.equal('1');
		expect(sets.join(',')).to.equal('1,1,1,1');

	});

	test('it should not listen to filtered keys', function () {
		let data = {
			rows: [
				{
					id: 1,
					value: 'Coke',
					translations: [{ 'en-US': 'Coke' }]
				}, {
					id: 2,
					value: 'Pepsi',
					translations: [{ 'en-US': 'Pepsi' }]

				}
			]
		};
		const events = [];

		const stack = new UndoStack(data, {
			onSet (o, value, key, target) {
				data = o;
				// console.log(' - ', key, value, target);
				if (key === 'value') {
					const translation = target.translations[0];
					translation[Object.keys(translation)[0]] = value;
				}
				events.push(key);
				events.push(1)
			},
			filter (key) {
				return /translations|-/.test(key);
			}
		});


		data.rows[0].value = 'Tab';
		console.log('data', data);

		expect(data.rows[0].translations.isProxy).to.equal(undefined);
		expect(data.rows[0].translations[0]['en-US'].isProxy).to.equal(undefined);
	});

	test('test max stack length', () => {
		const events = [];
		let data;
		const stack = new UndoStack({ s: 'a' }, {
			maxUndos: 5,
			onSet: function (o) {
				data = o;
				// console.log(' - ', o.s);
				events.push(o.s);
			}
		});
		data.s = 'ab';
		data.s = 'abc';
		data.s = 'abcd';
		data.s = 'abcde';
		data.s = 'abcdef';
		data.s = 'abcdefg';
		expect(stack.length).to.equal(5);
		stack.undo();
		stack.undo();
		stack.undo();
		stack.undo();
		stack.undo();
		stack.undo();
		stack.undo();
		stack.undo();
		console.log('data', data);
		expect(data.s).to.equal('abc');
		expect(stack.length).to.equal(5);
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