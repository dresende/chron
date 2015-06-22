var async = require("async");

module.exports = Chron;

function Chron(opts) {
	var opts  = opts || {};
	var tasks = [];
	var timer = null;

	var reschedule = function () {
		if (timer) clearTimeout(timer);
		if (tasks.length === 0) return;

		var next = null;

		tasks.map(function (task) {
			if (task.paused === true) {
				return;
			}
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

	var trigger = function () {
		if (timer) clearTimeout(timer);
		if (tasks.length === 0) return;

		var now = Date.now();

		async.eachSeries(tasks, function (task, next) {
			if (task.paused === true) {
				return next();
			}

			// Date.now() is called every time to compensate
			// function call.
			// This ensures that 2 timers that should trigger in a couple
			// of milliseconds will actually be called because the first
			// will delay a bit and then the second will trigger (avoiding)
			// creating a timer to trigger a few milliseconds later.
			if (task.next >= Date.now() + opts.advanceMargin) {
				return next();
			}

			if (opts.async === true) {
				call(task, function () {
					task.next = Date.now() + task.period;

					return next();
				});
			} else {
				call(task);
				task.next = Date.now() + task.period;

				return next();
			}
		}, function () {
			reschedule();
		});
	};

	var call = function (task, next) {
		task.task({
			pause: function () {
				task.paused = true;
				if (next) next();
				return this;
			},
			resume: function () {
				delete task.paused;
				return this;
			},
			remove: function () {
				chron.remove(task.task);
				if (next) next();
			},
			next: function () {
				if (next) next();
			}
		});
	};

	// 100 milli is the margin to call a task in advance
	opts.advanceMargin = opts.advanceMargin || 0.1;
	opts.advanceMargin *= 1000;

	var chron = {
		add: function (period, task) {
			period *= 1000;

			tasks.push({
				period : period,
				next   : Date.now() + period,
				task   : task
			});

			return this.resume();
		},
		remove: function (task) {
			tasks = tasks.filter(function (t) {
				return t.task !== task;
			});

			return this.resume();
		},
		clear: function () {
			tasks = [];

			return this.pause();
		},
		pause: function () {
			if (timer) clearTimeout(timer);
			return this;
		},
		resume: function () {
			reschedule();
			return this;
		}
	};

	return chron;
}
