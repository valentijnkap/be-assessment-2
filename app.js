'use strict'

var express = require('express')
var mongo = require('mongodb')
var bodyParser = require('body-parser')
var argon = require('argon2')
var session = require('express-session')
var methodOverride = require('method-override')
var multer = require('multer')
var path = require('path')
var fs = require('fs')

require('dotenv').config()

var db = null
var url = 'mongodb://' + process.env.DB_HOST + ':' + process.env.DB_PORT

mongo.MongoClient.connect(url, function (err, client) {
  if (err) throw err
  db = client.db(process.env.DB_NAME)
})

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    var uploadPath = 'static/uploads/' + req.session.user.username
    if (fs.exists(uploadPath)) {
      cb(null, uploadPath)
    } else {
      fs.mkdir(uploadPath, function () {
        cb(null, uploadPath)
      })
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

var upload = multer({storage: storage})
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
  .get('/', register)
  .post('/', registerUser)
  .get('/login', login)
  .post('/login', loginUser)
  .get('/logout', logout)
  .get('/feed', feed)
  .get('/edit', editProfile)
  .put('/edit', upload.single('thumb'), updateUser)
  .get('/write', writeForm)
  .post('/write', upload.single('banner'), postStory)
  .get('/users/:username', profile)
  .get('/stories/:id', storyDetail)
  .use(notFound)
  .listen(port, function () {
    console.log('The app is working on port: ' + port)
  })

function register (req, res) {
  if (req.session.user) {
    res.redirect('/feed')
  } else {
    var meta = {
      title: 'Register',
      caption: 'Photo by Katerina Radvanska - Unsplash',
      message: ''
    }
    res.render('pages/register.ejs', meta)
  }
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
        res.redirect('/users/' + data.username)
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
    var meta = {
      title: 'Feed'
    }
    
    db.collection('users').findOne({
      username: req.session.user.username
    }, ifHaveData)
    
    function ifHaveData (err, dataUsers) {
      if (err) throw err

      db.collection('stories').find().toArray(done)

      function done (err, dataStories) {
        if (err) throw err
        res.render('pages/feed', Object.assign({}, {dataUser: dataUsers, dataStories: dataStories }, meta))
      }
    }
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
  var data = req.body
  var user = req.session.user.username

  db.collection('users').update(
    {username: user},
    { $set: {
      name: data.name,
      email: data.email,
      place: data.place,
      thumb: req.file.filename
    }}, done)

  function done (err) {
    if (err) throw err
    res.redirect('/users/' + user)
  }
}

function logout (req, res) {
  req.session.destroy(redirect)
  
  function redirect (err) {
    if (err) throw err
    res.redirect('/login')
  }
}

function writeForm (req, res) {
  if (req.session.user) {
    db.collection('users').findOne({
      username: req.session.user.username
    }, done)
  } else {
    loginFirst(res)
  }

  function done (err, data) {
    if (err) throw err

    var meta = {
      title: 'Write a story'
    }

    res.render('pages/write.ejs', Object.assign({}, {data: data}, meta))
  }
}

function postStory (req, res) {
  var data = req.body
  var username = req.session.user.username

  var today = new Date()
  var dd = today.getDate()
  var mm = today.getMonth()+1
  var yyyy = today.getFullYear()

  var date = dd +  '-' + mm + '-' + yyyy

  db.collection('stories').insertOne({
    date: date,
    title: data.title,
    where: data.where,
    latitude: Number(data.lat),
    longitude: Number(data.long),
    banner: req.file.filename,
    summary: data.summary,
    story: data.story,
    userData: {
      username: username,
      name: data.name,
      thumb: data.thumb
    }
  }, done)

  function done (err, data) {
    if (err) throw err
    res.redirect('/feed')
  }
}

function storyDetail (req, res) {
  var id = req.params.id
  var checkID

  try {
    checkID = new mongo.ObjectID(id)
  } catch (err) {
    res.status(400).render('pages/error.ejs', {
      title: 400, 
      code: 400, 
      message: 'Sorry, we can not help you with this request!'
    })
    return
  }

  if (req.session.user) {
    var user = req.session.user.username

    db.collection('users').findOne({
      username: user
    }, ifHaveData)

    function ifHaveData (err, dataUser) {
      db.collection('stories').findOne({
        _id: new mongo.ObjectID(id)
      }, done)

      function done (err, dataStory) {
        if (err) throw err
        var meta = {
          title: dataStory.title
        }
        res.render('pages/detail.ejs', Object.assign({}, {dataUser: dataUser, dataStory: dataStory }, meta))
      }
    }
  } else {
    loginFirst(res)
  }
}

function profile (req, res) {
  var user = req.params.username

  if (req.session.user) {
    db.collection('users').findOne({
      username: user
    }, ifHaveData)

    function ifHaveData (err, dataUser) {
      if (err) {
        throw err
      } else if(!dataUser) {
        res.status(404).render('pages/error.ejs', {
          title: 404, 
          code: 404, 
          message: 'Sorry, we can not help you with this request!'
        })
      } else { 
        db.collection('stories').find({
          'userData.username': user
        }).toArray(done)

        function done (err, dataStories) {
          var meta = {
            title: user,
            session: req.session.user.username
          }
          res.render('pages/profile.ejs', Object.assign({}, {dataUser: dataUser, dataStories: dataStories}, meta))
        }
      }
    }
  } else {
    loginFirst(res)
  }
}

function notFound(req, res) {
  if (req.session.user) {
    res.status(404).render('pages/error.ejs', {
      title: 404, 
      code: 404, 
      message: 'Sorry, we can not help you with this request!'
    })
  } else {
    loginFirst(res)
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
