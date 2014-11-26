var start = require('./app')

start(function(err, app){
  console.log('Database is %s', app.db.open?'open':'closed')

  console.log('You have 5 seconds to kill me')

  setTimeout(function(){
    start.close(function(){
      console.log('Database is %s', app.db.open?'open':'closed')
    })
  }, 5000)
})
