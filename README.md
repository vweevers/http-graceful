# http-graceful

Gracefully open and close a http server, its sockets and perhaps a database.

Creates a function `start` that will call any `before` hooks you have specified - e.g. to open a database - before creating the server. Likewise, `start.close()` will call your `after` hooks - e.g. to close your database - and then closes the server and (optionally) its open connections. The same happens if the process receives a termination signal.

Note that if you don't call `start`, it will start in the next tick. Say you have an `app.js`, which exports `start`, like so:

```js
var app = express()

module.exports = httpGraceful(app, {
  close_sockets: true,
  sockets_timeout: 100,

  before: function(app, opts, done){
    openMyDatabase(function(err, db){
      app.db = db
      done()
    })
  },

  after: function(app, opts, done){
    app.db.close(done)
  }
})
```

To start the server, the usual still works: `node app.js`. But also, in some other file:

```js
var start = require('./app.js')

start(function(err, app){
   // Server has started, database is open
   doSomething()

   start.close(function(){ 
      //..
   })
})
```

If the server has already started (or closed), your callback will be called immediately.

See also the examples:

    DEBUG=http-graceful node example/app.js 
    DEBUG=http-graceful node example/app-consumer.js 

# install

With [npm](https://npmjs.org) do:

```
npm install http-graceful
```

# license

MIT
