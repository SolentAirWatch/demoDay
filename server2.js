#!/usr/bin/env node

var PORT = 33333;
var HOST = '0.0.0.0';
var HTTP_PORT = 8000;

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('five_pm_only_tmp.db');

var sensorDataSchema = {
    "pm": {
        "_sid": "integer", // sensor ID, 1,2,3,4,5
        "PM10": "double",
        "PM25_CF1": "double",
        "PM100_CF1": "double",
        "PM10_STD": "double",
        "PM25_STD": "double", // plot
        "PM100_STD": "double",
        "gr03um": "double",
        "gr25um": "double",
        "gr50um": "double",
        "gr10um": "double",
        "gr100um": "double",
        "gt05um": "double"
    }
}

var generateInsertQuery = function(tableName) {
    var tableDef = sensorDataSchema[tableName];
    if (tableDef === undefined) {
        console.log("Trying to generate a query for an unknown table", tableName);
        console.log("This has nothing to do with the actual SQL schema, but with the definition in sensorDataSchema variable.");
        return null;
    }

    var fieldNamesArr = ["timestamp"];
    for (var fieldName in tableDef) {
        fieldNamesArr.push(fieldName);
    }

    var q = "INSERT INTO `"+tableName+"`";
    q += " ("+fieldNamesArr.join(", ")+") ";
    var fieldNamesWith$ = fieldNamesArr.map(function(fieldName) { return "$"+fieldName; });
    q += "VALUES ("+fieldNamesWith$+")"

    return q;
}

// Cache insert queries
var queries = {};
for (var table in sensorDataSchema) {
    queries[table] = generateInsertQuery(table);
}

db.serialize(function() {

    for (var table in sensorDataSchema) {
        var fields = sensorDataSchema[table];
        var fields_arr = [
            "id INTEGER PRIMARY KEY AUTOINCREMENT",
            "timestamp datetime"
        ];
        for (var field_name in fields) {
            // console.log("Adding field...", field_name)
            var field_type = fields[field_name];
            fields_arr.push(field_name+" "+field_type);
        }
        var tblQuery = "CREATE TABLE if not exists "+table+" ("+fields_arr.join(", ")+")";
        console.log("Running:", tblQuery);
        db.run(tblQuery);
    }
});



var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Initialise plotly stuff (implementation in ./plotly.js)
// var plotlyhelper = require("./plotly");
// var messageKeys = ["$NO2WE", "$NO2AE", "$SO2WE", "$SO2AE", "$TEMP", "$VREF", "$PRES"];
// var plotly_filename_prefix = "air_quality_stream_";
// var plotlySender = new plotlyhelper.MessageSender(messageKeys, plotly_filename_prefix);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/server2index.html');
});

io.on('connection', function(socket) {
    console.log('a user connected', socket.id);

    for (var table in sensorDataSchema) {
        var query = "select * from " + table + " WHERE `_sid`=$_sid ORDER BY timestamp DESC LIMIT 10";
        var sids = [1,2,3,4,5];
        for (var s in sids) {
            db.all(query, {$_sid: sids[s]}, (function(table, sid) {
                return function(err, rows) {
                    if (err) {
                        // do something
                        console.error("Error getting", table, "initial data.", err);
                        return;
                    }
                    console.log("Sending", table, sid, "initial data to", socket.id);
                    rows = rows.sort(function(a, b) {
                        return new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime()
                    });
                    socket.emit("initial_data_"+table, sid, rows);
                }
            })(table, sids[s]));
        }
    }

});

http.listen(HTTP_PORT, function() {
    console.log('HTTP listening on *:'+HTTP_PORT);
});

server.on('listening', function() {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

var parseMessage = function(message) {
    try {
        return JSON.parse(message);
    } catch (e) {
        console.error("Couldn't parse JSON from UDP.", e);
    }
    return null;
}

var sendToBrowsers = function(message) {
    var _type = message._type;
    console.log("sending to browsers", message);
    var simple_message = {};
    for (var property in message) {
        var p = property;
        // remove $ prefix, leave _ prefix alone
        console.log(p, typeof p);
        console.log("sw", p.startsWith)

        if (p.startsWith("$")) {
            p = p.slice(1);
            simple_message[p] = message[property]
        }
    }
    simple_message._sid = message._sid;
    io.emit("update_"+_type, simple_message);
}

var filter$only = function(message) {
    var clean = {};
    for (var field in message) {
        if (field.startsWith("$")) {
            clean[field] = message[field];
        }
    }
    // every message must have a _sid (sensor ID)
    clean.$_sid = message._sid;
    return clean;
}

var udp_on_message = function(message, remote) {

    message = parseMessage(message);
    if (message == null) {
        return;
    }

    if (message._type == "pm") {
        sendToBrowsers(message);
        var query = queries.pm;
        var cleanMsg = filter$only(message);
        console.log("Running query", query);
        console.log("With data", cleanMsg);
        db.run(query, cleanMsg, function(error) {
            if (error) {                
                console.log("pm: An erorr while inserting:", error);                
                return            
            }
            console.log("pm: row inserted successfully.");
        });
    } else {
        console.log("Invalid message type", message._type, ". Message: ", message);
    }

};

server.on('message', udp_on_message);

server.bind(PORT, HOST);

// console.log("generating random data");
// var data_points = 50;
//
// var initial_date = 1489343890000;
// for (var i = 0; i < data_points; i++) {
//
//     message = {
//         '$timestamp': new Date(initial_date),
//         '$NO2WE': Math.random() * 50,
//         '$NO2AE': Math.random() * 50,
//         '$SO2WE': Math.random() * 50,
//         '$SO2AE': Math.random() * 50,
//         '$TEMP': Math.random() * 50,
//         '$VREF': Math.random() * 50,
//         '$PRES': Math.random() * 50
//     }
//     message = JSON.stringify(message)
//     udp_on_message(message, null)
//     initial_date += 10 * 1000;
// }
