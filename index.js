module.exports = starter

var httpClose = require('http-close')
  , xtend = require('xtend')
  , after = require('after')
  , http = require('http')
  , debug = require('debug')('http-graceful')

  , defaults =
    { port: 0
    , hostname: '127.0.0.1'
    , close_server: true
    , close_sockets: false
    , sockets_timeout: 5000
    }

  , sigs = 
    [ 'SIGHUP', 'SIGINT', 'SIGQUIT'
    , 'SIGILL', 'SIGTRAP', 'SIGABRT'
    , 'SIGBUS', 'SIGFPE', 'SIGUSR1'
    , 'SIGSEGV', 'SIGUSR2', 'SIGTERM' ]

function starter(app, opts) {
  opts = opts ? xtend(defaults, opts) : xtend(defaults)

  var server, started = 0

  function start(sOpts, cb) {
    if (typeof sOpts == 'function')
      cb = sOpts, sOpts = null

    if (started++) return cb && cb(null, app)

    sOpts = sOpts ? xtend(opts, sOpts) : xtend(opts)

    var fns = sOpts.before ? [].concat(sOpts.before) : []
    var next = after(fns.length, open)
    
    fns.forEach(function(fn){
      fn(app, sOpts, next)
    })

    function open(err){
      if (err) return cb && cb(err)

      server = http.createServer(app)

      if (sOpts.close_sockets)
        httpClose({timeout: sOpts.sockets_timeout}, server)

      server.listen(sOpts.port, sOpts.hostname, function(){
        var ad = server.address()
        debug('Listening on %s:%d', ad.address, ad.port)
        cb && process.nextTick(function(){
          cb(null, app)
        })
      })
    }
  }

  start.close = function(cOpts, cb) {
    if (!started) return cb && cb()

    if (typeof cOpts == 'function')
      cb = cOpts, cOpts = null

    cOpts = cOpts ? xtend(opts, cOpts) : xtend(opts)

    var fns = cOpts.after ? [].concat(cOpts.after) : []
    var next = after(fns.length, close)
    
    fns.forEach(function(fn){
      fn(app, cOpts, next)
    })

    function close(err) {
      if (err) return cb && cb(err)
      if (server && cOpts.close_server) server.close(closed)
      else closed()

      function closed() {
        debug('Server closed')
        started = 0
        cb && cb()
      }
    }
  }

  // Clean exit.
  sigs.forEach(function (sig) {
    process.on(sig, function (){
      var date = (new Date()).toGMTString()
      debug('%s: Received %s, exiting.', date, sig)
      start.close({close_server: false}, process.exit.bind(process, 1))
    })
  })

  setImmediate(start)
  return start
}
