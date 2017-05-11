
var lib = require("./plotly");

var tok = lib.TokenFactory.get();

var plotF = new lib.StreamingPlot("LOL-its-weird", tok, function(plot) {

	console.log("timeout now running.");
	console.log("plot ready", plot.ready);

	// send 5 points

	for (var i = 0; i<=5; i++) {
		var y = i*3;

		var point = {x:i, y:y};
		var rawData = JSON.stringify(point) + "\n";

		(function(msg) {
			console.log("Writing", msg,"...");
			plot.stream.write(msg, function(err, ok) {
				console.log("written",msg,". Res:" ,err, ok);
			});
		})(rawData);
	}

});