var url = 'http://spa.tial.ly:3001/demo'

getData = function (lat, lng, cb) {
    d3.jsonp(url + '?lat=' + lat + '&lng=' + lng + '&callback=d3.jsonp.foo', function (d) {
        cb(null, d);
    });
}

var generateTable = function () {
    var context = {};
    var table;
    var tbody;

    function createHeader(sessions) {
        if (table) {
            return;
        }
        table = d3.select(".table-container").append('table').attr('class', 'col-md-12 table table-bordered _table-responsive');
        var thead = table.append('thead').selectAll("th")
            .data(d3.keys(sessions[0]))
            .enter().append("th").attr('class', 'text-center').text(function (d) {
                return d
            });
        tbody = table.append('tbody')

    }
    context.add2Table = function (sessions) {
        if (!table) {
            createHeader(sessions);
        }
        sessions.forEach(function (d) {
            //var tr = tbody.prepend('tr')
            var tr = tbody.insertRow(0)
                .selectAll("td")
                .data(d3.values(d))

            .enter().append("td")
                .text(function (e) {

                    return e;
                });
        });

    };
    return context;
};
(function () {

    L.mapbox.accessToken = 'pk.eyJ1IjoibWFwcGlza3lsZSIsImEiOiJ5Zmp5SnV3In0.mTZSyXFbiPBbAsJCFW8kfg';
    var map = L.mapbox.map('map', 'examples.map-i86nkdio')
        .setView([40, -74.50], 9);
    map.addControl(L.mapbox.geocoderControl('mapbox.places'));

    var coordinates = document.getElementById('coordinates');

    var marker = L.marker(map.getCenter(), {
            icon: L.mapbox.marker.icon({
                'marker-color': '#f86767'
            }),
            draggable: true
        })
        .addTo(map);

    marker.on('dragend', ondragend);
    ondragend();

    var table = generateTable();

    function ondragend() {
        var m = marker.getLatLng();
        coordinates.innerHTML = 'Latitude: ' + m.lat + '<br />Longitude: ' + m.lng;

        getData(m.lat, m.lng, function (err, result) {
            if (err) {
                console.log(err);
                return;
            }
            r = result;

            var data = _.object(_.map(result.attributes, function (x) {
                return [x.attrName, x.attrValue];
            }));
            data['X/Y'] = result.x + ', ' + result.y;

            table.add2Table([data]);
        });

    }
})();
