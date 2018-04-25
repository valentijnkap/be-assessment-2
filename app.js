'use strict'

var express = require('express')
var mongo = require('mongodb')
var bodyParser = require('body-parser')
var argon = require('argon2')
var session = require('express-session')
var methodOverride = require('method-override')

require('dotenv').config()

var db = null
var url = 'mongodb://' + process.env.DB_HOST + ':' + process.env.DB_PORT

mongo.MongoClient.connect(url, function (err, client) {
  if (err) throw err
  db = client.db(process.env.DB_NAME)
})

var port = 8000

express()
  .set('view engine', 'ejs')
  .set('views', 'view')
  .use(express.static('static'))
  .use(methodOverride('X-HTTP-Method-Override'))
  .use(methodOverride('_method'))
  .use(bodyParser.urlencoded({ extended: false }))
  .use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
  }))
  .use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      var method = req.body._method
      delete req.body._method
      return method
    }
  }))
  .get('/', register)
  .post('/', registerUser)
  .get('/login', login)
  .post('/login', loginUser)
  .get('/logout', logout)
  .get('/feed', feed)
  .get('/edit', editProfile)
  .put('/edit', updateUser)
  .get('/:username', profile)
  .listen(port, function () {
    console.log('The app is working on port: ' + port)
  })

function register (req, res) {
  var meta = {
    title: 'Register',
    caption: 'Photo by Katerina Radvanska - Unsplash',
    message: ''
  }

  res.render('pages/register.ejs', meta)
}

function registerUser (req, res) {
  var username = req.body.username
  var password = req.body.password

  db.collection('users').findOne({
    username: username
  }, check)

  function check (err, data) {
    if (!data) {
      argon.hash(password).then(insert)
    } else if (data) {
      var meta = {
        title: 'Register',
        caption: 'Photo by Katerina Radvanska - Unsplash',
        message: 'Sorry, username has already been taken!'
      }
      res.render('pages/register.ejs', meta)
    }
  }

  function insert(hash) {
    db.collection('users').insertOne({
      username: req.body.username,
      name: req.body.name,
      place: req.body.place,
      email: req.body.email,
      password: hash,
      thumb: '',
      stories: [],
      followers: [],
      following: []
    }, done)
  }

  function done (err, data) {
    if (err) throw err
    res.redirect('/' + req.body.username)
  }
}

function login (req, res) {
  var meta = {
    title: 'Login',
    caption: 'Photo by Katerina Radvanska - Unsplash',
    message: ''
  }
  if (req.session.user == undefined) {
    res.render('pages/login.ejs', meta)
  } else if (req.session.user) {
    res.redirect('/' + req.session.user.username)
  }
}

function loginUser (req, res) {
  var username = req.body.username
  var password = req.body.password

  db.collection('users').findOne({
    username: username
  }, done)

  function done (err, data) {
    if (!data) {
      var meta = {
        title: 'login',
        caption: 'Photo by Katerina Radvanska - Unsplash',
        message: 'Sorry, the username does not exist!'
      }
      res.render('pages/login.ejs', meta)
    } else if (data.username) {
      argon.verify(data.password, password).then(onverify)
    }

    function onverify (match) {
      if (match) {
        req.session.user = {username: data.username}
        res.redirect('/' + data.username)
      } else {
        var meta = {
          title: 'login',
          caption: 'Photo by Katerina Radvanska - Unsplash',
          message: 'Sorry, the password is incorrect!'
        }
        res.render('pages/login.ejs', meta)
      }
    } 
  }
}

function feed (req, res) {
  if (req.session.user) {
    res.send('Hoi hij doet het')
  } else {
    loginFirst(res)
  }
}

function editProfile (req, res) {
  if (req.session.user) {
    var meta = {
      title: 'Edit ' + req.session.user.username
    }

    db.collection('users').findOne({
      username: req.session.user.username
    }, done)

    function done (err, data) {
      if (err) throw err
      res.render('pages/edit_profile.ejs', Object.assign({}, {data: data}, meta))
    }
  } else {
    loginFirst(res)
  }
}

function updateUser (req, res) {
  console.log('De put request komt door.')
  console.log(req.body)

  res.redirect('/' + req.session.user.username)
}

function logout (req, res) {
  req.session.destroy(redirect)
  
  function redirect (err) {
    if (err) throw err
    res.redirect('/login')
  }
}

function profile (req, res) {
  var user = req.params.username

  if (req.session.user) {
    db.collection('users').findOne({
      username: user
    }, done)
  } else {
    loginFirst(res)
  }

  function done (err, data) {
    var meta = {
      title: user,
      session: req.session.user.username
    }

    if (err) {
      throw err
    } else if(!data) {
      res.status(404).render('pages/error.ejs', {title: 404, code: 404, message: 'Sorry, we can not help you with this request!'})
    } else {
      res.render('pages/profile.ejs', Object.assign({}, {data: data}, meta))
    }
  }
}

function loginFirst (res) {
  var meta = {
      title: 'login',
      caption: 'Photo by Katerina Radvanska - Unsplash',
      message: 'You need to login first to make use of our service. Sorry! It`s a privacy thing!'
    }
    res.render('pages/login.ejs', meta)
}
