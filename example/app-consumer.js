var start = require('./app')
  , assert = require('assert')
  , prompt = require('cli-prompt')

start.on('listen', function(opts, next){
  assert(opts.color==='blue')
  console.log('Is database open? %s.', opts.app.db.open?'Yes':'No')

  prompt('Would you like to kill the server? (yes/no) ', function (val) {
    if (val[0]==='y') next(new Error('User killed me'))
    else next()
  })
})

start({color: 'blue'}, function(err, app){
  if (err) return

  console.log('You have 5 seconds to manually kill me')

  setTimeout(function(){
    start.close(function(){
      console.log('Is database open? %s.', app.db.open?'Yes':'No')
    })
  }, 5000)
})
