var httpGraceful = require('../')

var app = function(req, res) {
  res.end('aye')
}

var start = module.exports = httpGraceful(app, {
  port: 0,
  hostname: '127.0.0.1',

  // Whether to call server.close (see `http`)
  close_server: true,

  // Whether to close sockets (see `http-close`)
  close_sockets: true,
  
  // Timeout for open sockets (see `http-close`)
  sockets_timeout: 100
})

start.on('before listen', function(opts, next){
  openMockDatabase(function(err, db){
    app.db = db
    next()
  })
})

start.on('close', function(opts, next){
  console.log('Server closed.')
  app.db.close(next)
})

function openMockDatabase(cb){
  console.log('Opening the database')

  var db = { open: true }
  
  db.close = function(cb){
    console.log('Closing the database')
    db.open = false
    setTimeout(cb, 200)
  }

  setTimeout(function(){
    cb(null, db)
  }, 200)
}
