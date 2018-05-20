# Assessment 2

![Banner][banner]

# Places

This node app is an fictional social platform to share travel stories from different places. On this platform users can write stories about their journy, add pictures and even geo locations. Other users can read those stories and like them. It's an ongoing proces to improve my understanding of node. 

## Table of contents

* [**The story..**](#the-story)
* [**The making of..**](#th-making-of)
	* [The beginning](#the-beginning)
	* [MongoDB](#mongodb)
  * [The API](#the-api)
  * [Sessions](#sessions)
* [**Future goals**](#future-goals)
* [**Usage**](#usage)
* [**Recourses**](#recourses)

## The-story
This app is an assessment for a school course. It's meant to test my understanding about node and the tools around it like git and npm. There is no focus on frontend or design it's just backend oriented. That doesn't mean for me that I would just make an app that pushes and reads data from an databse. I wantend to make something useful and approach it like a real project. If you are interested in how I made this app then read the next section otherwise skip to [usage](#usage). 

## The making of

### The beginning
So how did I started? I'm like a construction worker. I can't work without a blueprint. I need to know what I am going to make. So started with simple design in [sketch](https://www.sketchapp.com/). It helped me discover what pages I needed to make and how the database should look like. If you are interested in the design you can look [here](design/).

The last 8 weeks where tough weeks. I learned the basics with package's like http, path, fs and many more. For the most part my skills where tested with the famous [`express`](https://expressjs.com/) framework. So I created [`app.js`](app.js) and wrote the basics steps. Setup a template viewer, serve the static folder and define a port. That was going very well for me. But then came the hardest part so far for me. After creating the register page and style it. I had to make it function and send the data from the client to the database.

### MongoDB
I wanted to use an SQL database but after brainstorming with a classmate he advized me to use MongoDB. It's mutch faster than SQL and I don't need relationships with this app (for now..). And even if I need them I can still make relations with a noSQL database. Plus I never worked with MongoDB or such databases so it's a good way to expand my horizon.

But when I started with MongoDB it was, if I may say so "A pain in the ass". I couldn't install MongoDB beceause I am running El Captain on my mac. There is an older version of Xcode on my mac and homebrew needs to newest to install MongoDB. I found a workaround for this problem on [Stack Overflow](https://stackoverflow.com/questions/48251108/mongodb-installation-failed-with-homebrew-and-xcode-8-1-1?rq=1). Then the next step.. 

Making an connection wasn't easy eather. But luckily my [teacher](https://github.com/wooorm) had an [example](https://github.com/cmda-be/course-17-18/blob/master/examples/mongodb-server/index.js) ready. There I found my way to make an connection to the database. I used the following code:

```javascript
var mongo = require('mongodb')

require('dotenv').config()

var db = null
var url = 'mongodb://' + process.env.DB_HOST + ':' + process.env.DB_PORT

// Make the connection
mongo.MongoClient.connect(url, function (err, client) {
  if (err) throw err
  db = client.db(process.env.DB_NAME)
})

// Insert the first data.
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
```

After couple of painfull days I came this far to make it work with an database. I found a way to get the stored data back into a template with this:

```javascript
function profile (req, res) {
  var user = req.params.username

  db.collection('users').findOne({
    username: user
  }, done)

  var meta = {
    title: user
  }

  function done (err, data) {
    if (err) {
      throw err
    } else {
      res.render('pages/profile.ejs', meta, {data: data})
    }
  }
}
```

### The API
While creating this project I found a lot of resources to help me understand what an API is and does. It helped me work with the request verbs (GET, POST, PUT and DELETE). Some of these verbs aren't supported by html right away so I dived in the world of work arounds. After trying multiple solutions my teacher advised me to use the package [method-override](https://www.npmjs.com/package/method-override). To setup the package and make the overrides I used an [tutorial](http://philipm.at/2017/method-override_in_expressjs.html) written by an other developer. 

To communicate with server from HTML I used an url request like this:

```html
<form action="/edit?_method=PUT" method="POST" enctype="multipart/form-data">
  ...
</form>
```

### Sessions
Another fenomenon in the node world is [sessions](https://www.npmjs.com/package/express-session). Making an platform where users can write stories and share them you need a way to authorize those users. That's where sessions comes in. I knew the very basics of the package and what it does globaly. But there is a lot more to it than I first tought. The way sessions use cookies is very interesting. I found an [article](https://nodewebapps.com/2017/06/18/how-do-nodejs-sessions-work/) from Tilo Mitra that gave me more info about the package. There a several way's to save session data but for this application an cookie that will be send to the browser will do the job. But I do understand the security issues. If an hacker figures out how my cookie is encrypted he can see the cookie data. That will be a problem in the future.

## Future goals
* [ ] Refactor the code to make it more maintainable.
* [ ] Use Mongoose instead of the original MongoDB driver.
* [ ] Adding new features like following other users and like stories.
* [ ] Adressing saftey issues.

## Usage

**Runs on:**

Node v8.11.01
MongoDB shell v3.0.15 

**Install app**
```sh
$ npm install
```

**Database**

Connect the app with MongoDB by creating an `.env` file that looks like this:

```
DB_HOST=<host>
DB_PORT=<port>
DB_NAME=<db-name>
SESSION_SECRET=<your-secret>
```

**Start app with**
```sh
$ node app.js
```

## Recourses 

* [Workaround mongodb on El Captain](https://stackoverflow.com/questions/48251108/mongodb-installation-failed-with-homebrew-and-xcode-8-1-1?rq=1)
* [MongoDB connection example](https://github.com/cmda-be/course-17-18/blob/master/examples/mongodb-server/index.js)
* [MongoDB docs](https://docs.mongodb.com/manual/tutorial/getting-started/)
* [Method override in Express](http://philipm.at/2017/method-override_in_expressjs.html)
* [How do nodejs session works](https://nodewebapps.com/2017/06/18/how-do-nodejs-sessions-work/)

## License
[GPL][license] © [Valentijn Kap](https://github.com/valentijnkap)

[banner]: banner.png
[license]: https://opensource.org/licenses/GPL-3.0