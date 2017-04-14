var express = require('express')
var app = express()
var mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/test2'
var mongodb = require("mongodb")
var mongo = mongodb.MongoClient
var https = require('https')

var apiKey = process.env.GOOGLE_API || 'api'
var cx = process.env.CX_KEY || 'cx' 

app.get('/search/:query', function (req, res) {
    var query = req.params.query
    var offset = parseInt(req.query.offset) || 0;
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

    var queryUrl = 'https://www.googleapis.com/customsearch/v1?key=' + apiKey + '&cx=' + cx + '&q=' + query + '&searchType=image&alt=json&num=10&start='+offset;

    https.get(queryUrl, function (response) {
        var data = "";
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            data+=chunk
        })
        var result = []
        response.on('end', function () {
            var fullResponse = JSON.parse(data)
            for (var i = 0; i < fullResponse.items.length; i ++) {
                var item = fullResponse.items[i]
                var image = {url: item.link, thumbnail: item.image.thumbnailLink, snippet: item.snippet}
                result.push(image)
            }
            res.send(JSON.stringify(result))
        })
    })
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