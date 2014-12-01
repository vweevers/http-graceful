# http-graceful

>Gracefully open and close a http server, its sockets and perhaps a database.

## about

Creates a function `start` that creates and opens a http server. Because `start` is an [AsyncEventEmitter](https://www.npmjs.org/package/async-eventemitter), you can add hooks, e.g. to open a database, that execute before or after the http server is opened. Likewise, you can add hooks that execute before or after the server is closed - either with `start.close()` or if the process receives a termination signal. Optionally, `http-graceful` will also close open connections.

Note that if you don't call `start`, it will start in the next tick. Say you have an `app.js`, which exports `start`, like so:

```js
var app = express()

var start = module.exports = httpGraceful(app, {
  close_sockets: true,
  sockets_timeout: 100
})

start.on('before listen', function(opts, next){
  openMyDatabase(function(err, db){
    app.db = db
    next(err)
  })
})

// There's also a "before close" event, but
// let's be safe and close the database 
// after all sockets have been closed.
start.on('close', function(opts, next){
  app.db.close(next)
})
```

To start the server, the usual still works: `node app.js`. But also, in some other file:

```js
var start = require('./app')

// Bonus: you can override options
start({sockets_timeout: 200}, function(err, app){
   // Server has started, database is open
   doSomething()

   // Or add your own options
   start.close({foo: 'bar'}, function(){ 
      //..
   })
})

// Without a callback argument, events are
// synchronous (see `async-eventemitter`)
start.once('before close', function(opts){
  assert(opts.foo==='bar')
})
```

If you call `start` when the server has already started, your callback will be called immediately and no events will be emitted. Same goes for `start.close()`.

See also the examples:

    DEBUG=http-graceful node example/app.js 
    DEBUG=http-graceful node example/app-consumer.js 

## install

With [npm](https://npmjs.org) do:

```
npm install http-graceful
```

## license

MIT
