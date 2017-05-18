var express = require('express');
var mongo = require('mongodb').MongoClient;

var app = express();
app.listen(process.env.PORT);

app.get('/new/:url(https?:\/\/*+)', function (req, res) {
    var original_url = req.params.url;
    mongo.connect(process.env.MONGOLAB_URI, function (err, db) {
        var response = {
            'original_url': original_url,
            'short_url': undefined
        };
        if (err) {
            res.end('Connection to database failed');
        } else {
            var url = db.collection('url');
            url.find({
                original_url: original_url
            }).toArray(function (err, data) {
                if (err) {
                    res.end('Database error');
                    db.close();
                }
                if (data.length === 0) {
                    url.find().toArray(function (err, data) {
                        if (err) {
                            res.end('Database error');
                        } else {
                            response.short_url = req.hostname + '/' + data.length;
                            url.insert(response, function (err, data) {
                                if (err) {
                                    res.end('Database error');
                                } else {
                                    response._id = undefined;
                                    res.json(response);
                                }
                                db.close();
                            });
                        }
                        db.close();
                    });
                } else {
                    response.short_url = data[0].short_url;
                    res.json(response);
                    db.close();
                }
            });
        }
    });
});

app.get('/:id', function (req, res) {
    mongo.connect(process.env.MONGOLAB_URI, function (err, db) {
        if (err) {
            res.end('Connection to database failed');
        } else {
            var url = db.collection('url');
            console.log(req.hostname);
            url.find({
                short_url: req.hostname + "/" + req.params.id
            }, {
                "_id": 0
            }).toArray(function (err, data) {
                if (err || data.length === 0) {
                    res.end('Entry not found');
                } else {
                    res.redirect(301, data[0].original_url);
                }
                db.close();
            });
        }

    });
});