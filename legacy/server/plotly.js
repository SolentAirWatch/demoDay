
var config = require("./config");

var plotly = require('plotly')(
	config.plotly_username,
	config.plotly_apikey
);

var StreamingPlot = function(filename, token, onready) {

	var data = [{x:[], y:[], stream: {token: token}}];

	var graphOptions = {
		fileopt : "extend",
		filename : filename
	};

	this.ready = false;

	plotly.plot(data, graphOptions, function() {
	 	this.stream = plotly.stream(token, function (err, res) {
			console.log("stream", filename, "closed", err, res);
			// this.ready = true;
			// onready(this.sendData);
		}.bind(this));

	 	this.stream.on("error", function (err) { console.log("Stream", filename, "error:", err); });
	 	this.stream.on("close", function (err) { console.log("Stream", filename, "close:", err); });
	 	this.stream.on("drain", function (err) { console.log("Stream", filename, "drain:", err); });
	 	this.stream.on("finish", function (err) { console.log("Stream", filename, "finish:", err); });

	 	this.sendBuffer();

	 	this.ready = true;

	 	if (onready){
		 	onready(this);	 		
	 	}

	}.bind(this));

	this.buffer = [];

	this.sendBuffer = function() {
		var msg;
		while (msg = this.buffer.shift(1)) {
			console.log("(",filename,") buffer: Sending", msg);
			this.stream.write(msg);
		}
	}.bind(this);

	this.sendData = function(xyPoint) {
		var msg = JSON.stringify(xyPoint)+"\n"
		if (this.ready) {
			this.stream.write(msg);
		} else {
			this.buffer.push(msg);
		}
	}.bind(this);

};

var TokenFactory = {
	tokens: ["uravdz1tvb", "z1nh4urbts", "rhzlkvsorw", "4l964nhkjt", "9th5ekqqf3", "igaqlcmcg69", "2ntkgtnrih", "rks98gcmr8"],
	current_token: 0,
	get: function() {
		if (TokenFactory.current_token >= TokenFactory.tokens.length) {
			return null;
		}
		var tok = TokenFactory.tokens[TokenFactory.current_token];
		TokenFactory.current_token++;
		return tok;
	}
}


var MessageSender = function(messageKeys, prefix) {

	this.plots = {};

	this.make_plot = function(name) {
		var tok = TokenFactory.get();
		if (tok === null) {
			console.error("Not enough free streaming tokens. Check plotly.js: TokenFactory.tokens array has enough elements.");
			return;
		}
		this.plots[name] = new StreamingPlot(prefix+name, tok);
	}.bind(this);

	for (var i in messageKeys) {
		var plotName = messageKeys[i];
		this.make_plot(plotName);
	}

	this.writeMessage = function(message) {
		var timestamp = message.$timestamp;

		for (var i in messageKeys) {
			var k = messageKeys[i];

			var value = message[k];

			var dataToSend = {x: timestamp, y: value};

			var targetPlot = this.plots[k];

			// if (!targetPlot.ready) {
			// 	console.log("Target plot", k, "not yet ready! Skipping this data point.");
			// } else {
			targetPlot.sendData(dataToSend);
			// }
		}
	}.bind(this);
}

module.exports = {"MessageSender": MessageSender, "TokenFactory": TokenFactory, "StreamingPlot": StreamingPlot};

