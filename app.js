'use strict'

var express = require('express')
var mongo = require('mongodb')
var bodyParser = require('body-parser')
var argon = require('argon2')
var session = require('express-session')

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
  .use(bodyParser.urlencoded({ extended: false }))
  .use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
  }))
  .get('/', register)
  .post('/', registerUser)
  .get('/login', login)
  .post('/login', loginUser)
  .get('/logout', logout)
  .get('/feed', feed)
  .get('/:username', profile)
  .listen(port, function() {
    console.log('The app is working on port: ' + port)
  })

function register (req, res) {
  var meta = {
    title: 'Register',
    caption: 'Photo by Katerina Radvanska - Unsplash'
  }

  res.render('pages/register.ejs', meta)
}

function registerUser (req, res) {
  var username = req.body.username
  var password = req.body.password

  argon.hash(password).then(insert)

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
  res.render('pages/login.ejs', meta)
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
    res.redirect('/login')
  }
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
    res.redirect('/login')
  }

  var meta = {
    title: user
  }

  function done (err, data) {
    if (err) {
      throw err
    } else if(!data) {
      res.status(404).render('pages/error.ejs', {title: 404, code: 404, message: 'Sorry, we can not help you with this request!'})
    } else {
      res.render('pages/profile.ejs', Object.assign({}, {data: data}, meta))
    }
  }
}
