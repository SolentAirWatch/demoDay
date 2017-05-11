var PORT = 33333;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('test.db');
db.serialize(function() {
  	db.run("CREATE TABLE if not exists test (timestamp datetime, NO2WE double, NO2AE double, SO2WE double, SO2AE double, TEMP double, VREF double)");
});

var static = require('node-static');
 
// 
// Create a node-static server instance to serve the './public' folder 
// 
var file = new static.Server('./public');
 
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        // 
        // Serve files! 
        // 
        file.serve(request, response);
    }).resume();
}).listen(8080);


server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

var udp_on_message = function (message, remote) {
	
	message=JSON.parse(message);
	console.log(message);

    // not using those anymore:
    //     for(var myKey in message) {
    //     if(message.hasOwnProperty ('myKey')){
    query = "INSERT INTO \"test\"(timestamp, NO2WE, NO2AE, SO2WE, SO2AE, TEMP, VREF) VALUES ($timestamp, $NO2WE, $NO2AE, $SO2WE, $SO2AE, $TEMP, $VREF)"
    db.run(query, message, function(error) {
            if (error) {
                console.log("An erorr while inserting:", error);
                return;
            }
            console.log("inserted successfully");
        }
    )
};

server.on('message', udp_on_message);

server.bind(PORT, HOST);

// console.log("generating random data");
// var data_points = 50;

// for (var i=0;i<data_points;i++) {
// 	message = {'$timestamp': i, '$NO2WE':i, '$NO2AE':i, '$SO2WE':i, '$SO2AE':i, '$TEMP':i, '$VREF':i}
// 	message = JSON.stringify(message)
// 	udp_on_message(message, null)
// }

