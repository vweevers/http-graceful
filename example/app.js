var httpGraceful = require('../')

var app = function(req, res) {
  res.end('aye')
}

module.exports = httpGraceful(app, {
  port: 0,
  hostname: '127.0.0.1',

  // Whether to call server.close (see `http`)
  close_server: true,

  // Whether to close sockets (see `http-close`)
  close_sockets: true,
  
  // Timeout for open sockets (see `http-close`)
  sockets_timeout: 100,

  before: function(app, opts, done){
    // open db
    openMockDatabase(function(err, db){
      app.db = db
      done()
    })
  },

  after: function(app, opts, done){
    // close db
    app.db.close(done)
  }
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
