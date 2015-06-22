# Chron

NodeJS task scheduler.

## Install

```sh
npm install chron
```

## Usage

```js
var chron = new require("chron")();

chron.add(10, doSomething); // called every 10 seconds
chron.add(1.5, doSomething); // called every 1.5 seconds

function doSomething() {
    console.log("doing..");
}
```

The advantage of the scheduler is it only has one timer, even if you have hundreds of tasks. It calculates when the next task needs to run and schedules a timer.

## API

- chron.add(period, task)
- chron.remove(task)
- chron.clear()
- chron.pause()
- chron.resume()

A `task` is a function that receives a parameter that you can use to control the task execution (the next calls).

```js
function doSomething($) {
    $.pause();   // will stop executing, you need to store
                 // a reference to $ to be able to resume
    $.resume();  // resume the previsouly paused task
    $.remove();  // completely remove the task - equal to chron.remove(task)
}
```
