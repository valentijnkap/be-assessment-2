'use strict'

var express = require('express')
var mongo = require('mongodb')
var bodyParser = require('body-parser')

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
  .get('/', register)
  .post('/', registerUser)
  .get('/login', login)
  .get('/:username', profile)
  .listen(port)

console.log('The app is working on port: ' + port)

function register (req, res) {
  var meta = {
    title: 'Register',
    caption: 'Photo by Katerina Radvanska -  Unsplash'
  }

  res.render('pages/register.ejs', meta)
}

function registerUser (req, res) {
  db.collection('users').insertOne({
    username: req.body.username,
    name: req.body.name,
    place: req.body.place,
    email: req.body.email,
    password: req.body.password
  }, done)

  function done (err, data) {
    if (err) throw err

    res.redirect('/' + req.body.username)
  }
}

function login (req, res) {
  var meta = {
    title: 'Login',
    caption: 'Photo by Katerina Radvanska -  Unsplash'
  }

  res.render('pages/login.ejs', meta)
}

function profile (req, res) {
  var user = req.params.username

  console.log(user)

  db.collection('users').findOne({
    username: user
  }, done)

  var meta = {
    title: user
  }

  function done (err, data) {
    if (err) {
      throw err
      console.log(err)
    } else {
      console.log(data)
      res.render('pages/profile.ejs', Object.assign({}, {data: data}, meta))
    }
  }
}
