//JS and Leaflet demo
var map = L.map('map',{
    center: [50.9055, -1.4047],
    zoom: 13
});
    
 L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoiam9zaGN0YXlsb3IiLCJhIjoiY2o2em10NG4wMm1sZzJ4bno2bWlrY3htdiJ9.mqshzFtuoQre061sDc2Kag'
    }).addTo(map);

//    alternative map tile
//    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
//    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
//    }).addTo(map);


// var marker = L.marker([50.9055, -1.4047]).addTo(map);

var circle = L.circle([50.9366267,-1.4306441], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

var circle = L.circle([50.9055, -1.4047], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);
