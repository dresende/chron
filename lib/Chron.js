const async = require("async");

module.exports = Chron;

function Chron(opts = {}) {
	let tasks      = [];
	let timer      = null;
	let reschedule = () => {
		if (timer) clearTimeout(timer);
		if (tasks.length === 0) return;

		let next = null;

		tasks.map((task) => {
			if (task.paused === true) return;

			if (!next || task.next < next) {
				next = task.next;
			}
		});

		if (!next) return;

		if (next < Date.now()) {
			return trigger();
		}

		timer = setTimeout(trigger, next - Date.now());
	};

	let task_next = (task) => {
		task.next = Date.now() + task.period;

		if (opts.align) {
			task.next -= (task.next % task.period);
		}
	};
	let trigger = () => {
		if (timer) clearTimeout(timer);
		if (tasks.length === 0) return;

		var now = Date.now();

		async.eachSeries(tasks, (task, next) => {
			// task paused
			if (task.paused === true) return next();
			// tasks were cleared in the meantime
			if (!tasks.length) return next();

			// Date.now() is called every time to compensate
			// function call.
			// This ensures that 2 timers that should trigger in a couple
			// of milliseconds will actually be called because the first
			// will delay a bit and then the second will trigger (avoiding)
			// creating a timer to trigger a few milliseconds later.
			if (task.next >= Date.now() + opts.advanceMargin) return next();

			if (opts.async === true) {
				call(task, () => {
					task_next(task);

					return next();
				});
			} else {
				call(task);
				task_next(task);

				return next();
			}
		}, reschedule);
	};

	let call = (task, next) => {
		task.task({
			pause : function () {
				task.paused = true;

				if (next) next();

				return this;
			},
			resume : function () {

				delete task.paused;

				return this;
			},
			remove : function () {
				chron.remove(task.task);

				if (next) next();
			},
			next : function () {
				if (next) next();
			}
		});
	};

	// 100 milli is the margin to call a task in advance
	opts.advanceMargin = opts.advanceMargin || 0.1;
	opts.advanceMargin *= 1000;

	let chron = {
		add : function (period, task) {
			period *= 1000;

			tasks.push({
				period : period,
				task   : task
			});

			task_next(tasks[tasks.length - 1]);

			return this.resume();
		},
		remove : function (task) {
			tasks = tasks.filter((t) => (t.task !== task));

			return this.resume();
		},
		clear : function () {
			tasks = [];

			return this.pause();
		},
		pause : function () {
			if (timer) clearTimeout(timer);

			return this;
		},
		resume : function () {
			reschedule();

			return this;
		}
	};

	return chron;
}
