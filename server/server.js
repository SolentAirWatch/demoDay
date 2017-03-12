var PORT = 33333;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('test.db');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/graph.html');
});

io.on('connection', function(socket){
  console.log('a user connected', socket.id);

  query = "select * from test order by timestamp DESC limit 10";
  db.all(query, function(err, rows) {
    if (err) {
        // do something
        console.error(err);
        return;
    }
    console.log("sending initial data to", socket.id);
    rows = rows.sort(function(a,b) { return new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime() });
    socket.emit("initial_data", rows);
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

db.serialize(function() {
  	db.run("CREATE TABLE if not exists test (timestamp datetime, NO2WE double, NO2AE double, SO2WE double, SO2AE double, TEMP double, VREF double, PRES double)");
});


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
    query = "INSERT INTO \"test\"(timestamp, NO2WE, NO2AE, SO2WE, SO2AE, TEMP, VREF, PRES) VALUES ($timestamp, $NO2WE, $NO2AE, $SO2WE, $SO2AE, $TEMP, $VREF, $PRES)"
    db.run(query, message, function(error) {
            if (error) {
                console.log("An erorr while inserting:", error);
                return;
            }
            var simple_message = {};
            for (var property in message) {
                simple_message[property.slice(1)] = message[property]
            }
            io.emit("update_data", simple_message);
            console.log("inserted successfully");
        }
    )
};

server.on('message', udp_on_message);

server.bind(PORT, HOST);

console.log("generating random data");
var data_points = 50;

var initial_date = 1489343890000;
for (var i=0;i<data_points;i++) {

	message = {
        '$timestamp': new Date(initial_date),
        '$NO2WE':Math.random() * 50,
        '$NO2AE':Math.random() * 50,
        '$SO2WE':Math.random() * 50,
        '$SO2AE':Math.random() * 50,
        '$TEMP':Math.random() * 50,
        '$VREF':Math.random() * 50,
        '$PRES':Math.random() * 50
    }
	message = JSON.stringify(message)
	udp_on_message(message, null)
    initial_date += 10 * 1000;
}

