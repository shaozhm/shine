'use strict';

exports.Queue = Queue;

function Queue() {
    this.queue = [];
    this.busy = false;
}

Object.defineProperty(Queue.prototype, 'empty', {
    get: function isEmpty() {
        return this.queue.length === 0;
    }
});

Queue.prototype.push = function push(worker, callback, name) {
    var task = new Task(worker, callback, name);
    this.queue.push(task);
    this.run();
    return this;
};

Queue.prototype.run = function() {
    var self = this;

    function next(err, name) {
        self.busy = false;
        if (self.queue.length)
            run();
    }

    function run() {
        if (!self.busy) {
            self.busy = true;
            var task = self.queue.shift();
            task.run(next);
        }
    }

    run();
};


function Task(worker, callback, name) {
    this.worker = worker;
    this.callback = callback;
    this.name = name;
}

Task.prototype.run = function run(next) {
    var self = this;

    function done() {
        self.callback.apply(null, arguments);
        next(null, self.name);
    }

    this.worker(done);  // do NOT convert exceptions into errors!
};