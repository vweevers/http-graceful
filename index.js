module.exports = starter

var httpClose = require('http-close')
  , xtend     = require('xtend')
  , http      = require('http')
  , debug     = require('debug')('http-graceful')
  , Emitter   = require('async-eventemitter')

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
  opts.app = app

  var server, started = 0
    , emitter = new Emitter()

  function start(sOpts, cb) {
    if (typeof sOpts == 'function')
      cb = sOpts, sOpts = null

    if (started++) return cb && cb(null, app)

    server = opts.server = http.createServer(app)
    sOpts = sOpts ? xtend(opts, sOpts) : xtend(opts)

    if (sOpts.close_sockets)
      httpClose({timeout: sOpts.sockets_timeout}, server)

    emitter.emit('before listen', sOpts, function listen(err){
      if (err) {
        debug(err)
        return cb && cb(err)
      }

      server.listen(sOpts.port, sOpts.hostname, function(){
        var ad = server.address()
        debug('Listening on %s:%d', ad.address, ad.port)

        emitter.emit('listen', sOpts, function(err){
          if (err) return start.close(function(){
            debug(err)
            cb && cb(err)
          })

          cb && process.nextTick(function(){
            cb(null, app)
          })
        })       
      })
    })
  }  

  for(var m in Emitter.prototype)
    start[m] = emitter[m].bind(emitter)

  start.close = function(cOpts, cb) {
    if (typeof cOpts == 'function')
      cb = cOpts, cOpts = null

    if (!started) return cb && cb()

    cOpts = cOpts ? xtend(opts, cOpts) : xtend(opts)

    emitter.emit('before close', cOpts, function close(err) {
      if (err) {
        debug(err)
        return cb && cb(err)
      }

      if (server && cOpts.close_server) server.close(closed)
      else closed()

      function closed() {
        debug('Server closed')
        started = 0
        emitter.emit('close', cOpts, cb)
      }
    })
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
