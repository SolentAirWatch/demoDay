#!/usr/bin/env node

// generate a fake message from the given sensor
//
// you can use this file for testing like this:
// ./generate.js a4 > /dev/udp/0.0.0.0/33333

/*
If you get errors with:

    throw new Error('Implement me. Unknown stream file type!');

Just use:

./generate.js a4 | cat > /dev/udp/0.0.0.0/33333

instead. (notice the `| cat >` part.)
 */

if (process.argv.length < 3) {
    console.error("Not enough arguments.");
    console.error("Usage: ./generate.js [a4|pm|bmp] > /dev/udp/0.0.0.0/33333")
    process.exit(1);
}

var sensorName = process.argv[2];

var sensorDataSchema = {
    "a4": {
        "NO2WE": "double", // plot
        "NO2AE": "double", // plot
        "SO2WE": "double", // plot
        "SO2AE": "double", // plot
        "TEMP": "double", // plot
        "VREF": "double", // plot
        "NO2_ppb": "double",
        "SO2_ppb": "double"
    },
    "bmp": {
        "TEMP": "double",
        "PRES": "double" // plot
    },
    "pm": {
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

var sensor = sensorDataSchema[sensorName];
if (sensor === undefined) {
    console.error("unknown sensor", sensorName,". Use one of a4, bmp or pm.");
    process.exit(1);
}

var msg = {
    "$timestamp": new Date().toString(),
    "_type": sensorName
};
for (var readingName in sensor) {
    msg["$"+readingName] = Math.random() * 50;
}

console.log(JSON.stringify(msg));
