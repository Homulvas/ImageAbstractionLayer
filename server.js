var express = require('express')
var app = express()
var mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/test2';
var mongodb = require("mongodb");
var mongo = mongodb.MongoClient

app.get('/search/*', function (req, res) {
    var query = req.params[0]
    mongo.connect(mongoUrl, function (err, db) {
        if (err) {
            return res.send(err);
        }
        var coll = db.collection('visits');
        var queryObj = { query: query, 'created_on': new Date() }
        coll.insert(queryObj, function (err, data) {
            if (err) {
                return res.send(err);
            }
        })

        db.close();
    })
    res.send('need to get search results for ' + query)
})

app.get('/recent', function (req, res) {
    mongo.connect(mongoUrl, function (err, db) {
        if (err) {
            return res.send(err);
        }
        var coll = db.collection('visits')
        var recent = coll.find({}, { _id: 0, query: 1, created_on: 1 })
        .sort({ _id: -1 })
        .limit(5)
        .toArray(function (err, data) {
            if (err) {
                return res.send(err);
            }
            res.send(JSON.stringify(data))
        })

        db.close();
    })
})

app.get('/', function (req, res) {
    res.send('go to /search to query images, or to /recent to see request history')
})

var port = process.env.PORT || 8080
app.listen(port, function () {
    console.log('Server listening on port ' + port + '!')
})