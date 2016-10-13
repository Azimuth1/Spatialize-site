var pg = require('pg');
var express = require('express');
var app = express();
var conString = "postgres://postgres:SpatializeIt@localhost/spize";
var http = require('http');

app.get('/demo', function (req, res) {

    // get a pg client from the connection pool
    pg.connect(conString, function (err, client, done) {

        var handleError = function (err) {
            // no error occurred, continue with the request
            if (!err) return false;
            done(client);
            //res.writeHead(500, {'content-type': 'text/plain'});
            res.end('An error occurred');
            return true;
        };

        var lat = req.param('lat');
        var lng = req.param('lng');
        var currentdate = new Date();
        var datetime = currentdate.toISOString();

        var returnData = {
            api: "spatialize.it",
            type: "point",
            x: lng,
            y: lat,
            date: datetime,
            attributes: []
        };

        var qString1 = 'SELECT name FROM tl_2014_us_county c where ST_Contains(CAST(c.geom AS geometry),ST_GeomFromText(\'POINT(' + lng + ' ' + lat + ')\',4326))=true;';
        client.query(qString1, function (err, result) {
            if (handleError(err)) return;

            if (result.rows.length > 0) {
                returnData.attributes.push({
                    'US County': result.rows[0].name
                });
            } else {
                returnData.attributes.push({
                    'US County': 'Out of Area'
                });

            }
            if (returnData.attributes.length === 3) {
                // done();  //return client to connection pool;
                //res.send(JSON.stringify(returnData, null, '\t'));
            }
        }); //query

        var qString2 = 'SELECT PRO_DESC FROM provinces c where ST_Contains(CAST(c.geom AS geometry),ST_GeomFromText(\'POINT(' + lng + ' ' + lat + ')\',4326))=true;';
        client.query(qString2, function (err, result) {
            if (handleError(err)) return;

            if (result.rows.length > 0) {
                returnData.attributes.push({
                    attrName: 'Global EcoRegion',
                    attrValue: result.rows[0].pro_desc
                });
            } else {
                returnData.attributes.push({
                    attrName: 'Global EcoRegion',
                    attrValue: 'Out of Area'
                });
            }
            if (returnData.attributes.length === 3) {
                //done();  //return client to connection pool;
                //res.send(JSON.stringify(returnData, null, '\t'));
            }
        }); //query

        var qString3 = 'SELECT statename, cd114fp FROM tl_2014_us_cd114 c where ST_Contains(CAST(c.geom AS geometry),ST_GeomFromText(\'POINT(' + lng + ' ' + lat + ')\',4326))=true;';
        client.query(qString3, function (err, result) {
            if (handleError(err)) return;

            if (result.rows.length > 0) {
                returnData.attributes.push({
                    'US 114th Congressional District': result.rows[0].statename + ' ' + result.rows[0].cd114fp
                }); //pg package references all fields in lowercase
            } else {
                returnData.attributes.push({
                    'US 114th Congressional District': 'Out of Area'
                });
            }
            if (returnData.attributes.length === 3) {
                // done();  //return client to connection pool;
                res.send(JSON.stringify(returnData, null, '\t'));
            }
        }); //query

        /*
        // Alternate approach that iterates over an array of attribute objects, more like we'll generate from the catalog index.
        var queries = [{title: 'US County', query: qString1}, {title: 'Global EcoRegion', query: qString2}, {title: 'US 114th Congressional District', query: qString3]];
        queries.foreach(function(q){
           client.query(q.query, function(err, result) {
             if(handleError(err)) return;

             if (result.rows.length > 0) {
                 returnData.attributes.push({q.title: result.rows[0].statename + ' ' + result.rows[0].cd114fp});   //pg package references all fields in lowercase
             } else {
                 returnData.attributes.push({q.title: 'Out of Area'});
             }
           }};  //query
        });
        */

        //      returnData.attributes.push({'US Test': 'A Value'});
        //      res.send(JSON.stringify(returnData, null, '\t'));

    }); //pg.connect

}); //app get

app.get('/spatially', function (req, res1) {
    var lat = req.param('lat');
    var lng = req.param('lng');

    var url = 'http://spa.tial.ly:3001/demo?lat=' + lat + '&lng=' + lng;

    http.get(url, function (res) {
            var body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function () {

                var fbResponse = JSON.parse(body)

                res1.send(fbResponse);
            });
        })
        .on('error', function (e) {
            console.log("Got error: ", e);
            res1.send(null, e);
        });

});

app.use(express.static('./'));
app.listen(3001);
/*
var server = app.listen(3001, function () {
    var host = server.address()
        .address;
    var port = server.address()
        .port;
    console.log('SpatializeIt app listening at http://%s:%s', host, port);
});*/
