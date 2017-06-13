var maxDataPointsInCharts = 100;
// this is a list of charts.
var pmChartBySid = {};

//this is a list of sensors which are sending data.
//it is populated on the fly, as we receive data from the sensor.
//it is found under message.id
var sensors_active = {}

function make_chart(id) {
	//this function makes a blank chart with name "id".
	var chart = new Chart(id, {
		type: 'line',
		data: {
			datasets: []
		},
		options: {
			scales: {
				xAxes: [{
					type: 'time',
					ticks: {
						autoSkip: false,
						maxRotation: 0,
						minRotation: 0
					},
					// position: 'bottom',
					time: {
						displayFormats: {
							'millisecond': 'HH:MM:SS',
							'second': 'HH:MM:SS',
							'minute': 'HH:MM:SS',
							'hour': 'HH:MM:SS',
							'day': 'HH:MM:SS',
							'week': 'HH:MM:SS',
							'month': 'HH:MM:SS',
							'quarter': 'HH:MM:SS',
							'year': 'HH:MM:SS'
						}
					}
				}],
				yAxes: [{
					display: true,
					ticks: {
						beginAtZero: true,// minimum value will be 0. 
						suggestedMax: 120
					}
				}]
			},
			maintainAspectRatio: false,
			animation: false,
			legend: { display: false },
			elements: { point: { radius: 0 } }
		}
	});
	chart.name = id;
	chart.buffers = [];
	return chart;
}
//ctx potentially interferes with the chart working, it's a variable used by Chart.js
var ctx = undefined;
window.addEventListener("load", function() {
	// make pm charts by sid
	var chartsContainer = document.getElementById("chart_container");

	//each chart gets a div with text etc
	//for loop here is replaced so only get one copy

	for (var i=1;i<=1;i++) {
		var el = document.createElement("div");
		el.className="chart";

		// sensor ID text
		var txt = document.createElement("div");
		txt.className = "chart_text";
		txt.innerText = "Live sensor data";
		el.appendChild(txt);

		// canvas
		var canvas = document.createElement("canvas");
		el.appendChild(canvas);
		canvas.className="chart_canvas";
		canvas.id = "chart_canvas";
		chartsContainer.appendChild(el);
	}
	//add a single chart for now
	for (var i=1;i<=1;i++) {
		pmChartBySid[i] = {
			"chart": make_chart("chart_canvas"),
			"domid": "chart_canvas",
			"dataset": null,
			"timeout": null,
			"name": "PM",
			"IDbuffer": []
		}
	}
});

//set up the event listener
//so that we know when we first receive data
var token ="";
var eventnum = 1;
$.postJSON = function(url, data, callback) {
	return jQuery.ajax({
		headers: { 
			'Accept': 'application/json',
			'Content-Type': 'application/json' 
		},
		'type': 'POST',
		'url': url,
		'data': JSON.stringify(data),
		'dataType': 'json',
		'success': callback
	});
};

//alternatively contact the API for historical data
$.APIgetJSON = function(url, APIkey, callback) {
	return jQuery.ajax({
		headers: { 
			'Accept': 'application/json',
			'Content-Type': 'application/json', 
			'Authorization': 'api-key ' + APIkey
		},
		'type': 'GET',
		'url': url,
		//'data': JSON.stringify(data),
		//'dataType': 'json',
		'success': callback
	});
}

//get plot_mode
var plot_mode = "";
while (!["H","L","h","l"].includes(plot_mode)) {
	plot_mode = prompt("Plot (H)istorical or (L)ive data?", "L");
}

//decide which plotting mode
//and then process data
if(plot_mode == "H" || plot_mode == "h") {
	//plotting historical data
	var startDate = "2017-06-13T08:00:00Z";
	var endDate = "2017-06-13T08:01:00Z";
	var apiBaseUrl = "https://api.opensensors.io/v1/messages/topic//orgs/solentairwatch/sniffy?";
	var apiHistoryUrl = apiBaseUrl + "start-date=" + startDate + "&end-date=" + endDate;
	$.APIgetJSON(apiHistoryUrl, "58817278-964d-46de-bb15-bddfbfb6f2e6", function(data) {
		var messageLength = data.messages.length;	
		var message = {};
		var sid = 0;
		console.log("got " + messageLength + " messages in total");
		for (var c = 0; c < messageLength; c++){
			message = JSON.parse(data.messages[c].payload.text);
			sid = message.id;
			console.log(message);
			console.log("reading history item with sid = " + sid);
			if ( c == 0) {
				processInitialDataChart("pm", 1, message, sid);
			} else {
				processStreamDataChart("pm", message, sid);
			}
		}
	});
} else {
	//get the token, and on response set up event listener
	$.postJSON("https://api.opensensors.io/v1/login",
		{
			"username" : "solentairwatch",
			"password" : prompt("Enter opensensors password:", "")
		},
		function(data, status) {
			token = data.token;	
			console.log(status);
			var apiRealtimeUrl = "https://realtime.opensensors.io/v1/events/users/solentairwatch/topics?token=" + token;
			var eventUrl = new EventSource(apiRealtimeUrl);
			eventUrl.onmessage = function(event) {
				eventnum += 1;
				//how many of the inital messages do we ignore
				var ignore = 3;
				var message = JSON.parse(JSON.parse(event.data).message);
			//	console.log(message);
				var sid = message.id;
				console.log("message from id " + sid);
				if ( eventnum < ignore + 1 ) {
					//opensensors sends strange initial data, dump it
				} else if ( eventnum == ignore + 1){
					//log the first one we're plotting
					console.log(message);
					processInitialDataChart("pm", 1, message, sid);
				} else {
					//update data
					processStreamDataChart("pm", message, sid);
				}
			}
		}
	);
}

function processInitialDataChart(sensor_name, chartid, message, sid) {
	var dataXy = [{x: message.time, y: message.PM25}];
	//	console.log(dataXy)
	var dataset = getOrCreateDataset(sensor_name, sid, chartid, "PM25");
	dataset.data = dataXy;

	// update all charts
	//pmChartBySid[chartid].chart.update(00, false);
}

function processStreamDataChart(sensor_name, message, sid) {
	getOrCreateDataset(sensor_name, sid, 1, "PM25");
	var datapoint = {x: message.time, y: message.PM25};
	var datapointWithID = {id: sid, datapoint : datapoint};
//	addDataPoint(sid, 1, "PM25", datapoint);
	addDataPointWithID(1, "PM25", datapointWithID);
}

function addDataPoint(sid, chartid, readingName, point) {
	var cfg = pmChartBySid[chartid];
	cfg.buffer.push(point);
	new_requestRender(sid, cfg);
}

function addDataPointWithID(chartid, readingName, IDpoint) {
	var cfg = pmChartBySid[chartid];
	cfg.IDbuffer.push(IDpoint);
	IDrequestRender(cfg);
}

function new_requestRender(sid, cfg) {
	// update all charts

	var chart = cfg.chart;

	var buffer = cfg.buffer;
	var dataset = chart.data.datasets[datasets_existing_for.indexOf(sid)];

	var data = dataset.data;
	data.push(buffer[0]);

	buffer.length = 0;
	if (data.length > maxDataPointsInCharts) {
		data = data.slice(data.length - maxDataPointsInCharts);
	}

	dataset.data = data;

	chart.update(0, false);
}

function IDrequestRender(cfg) {
	// update all charts
	if (cfg.timeout !== null) {
		// do nothing, there's a timeout already
		return
	}

	// there is no timeout, so set one
	cfg.timeout = setTimeout(function(){
		//console.log("rendering", cfg.name, cfg);

		var chart = cfg.chart;

		var IDbuffer = cfg.IDbuffer;
		
		//var dataset = chart.data.datasets[datasets_existing_for.indexOf(sid)];

		var datasets = chart.data.datasets;

		//var data = dataset.data.slice();
		for (var j in IDbuffer) {
			datasets[datasets_existing_for.indexOf(IDbuffer[j].id)].data.push(IDbuffer[j].datapoint);
			//data.push(buffer[j]);
		}

		IDbuffer.length = 0;
		/*
		if (data.length > maxDataPointsInCharts) {
			data = data.slice(data.length - maxDataPointsInCharts);
		}
		*/

		/* this needs adapting somehow...
		dataset.data = data;
		*/

		chart.update(0, false);
		cfg.timeout = null;

	}, 500);
}

function requestRender(sid, cfg) {
	// update all charts
	if (cfg.timeout !== null) {
		// do nothing, there's a timeout already
		return
	}

	// there is no timeout, so set one
	cfg.timeout = setTimeout(function(){
		//console.log("rendering", cfg.name, cfg);

		var chart = cfg.chart;

		var buffer = cfg.buffer;
		var dataset = chart.data.datasets[datasets_existing_for.indexOf(sid)];

		var data = dataset.data.slice();
		for (var j in buffer) {
			data.push(buffer[j]);
		}

		buffer.length = 0;
		if (data.length > maxDataPointsInCharts) {
			data = data.slice(data.length - maxDataPointsInCharts);
		}

		dataset.data = data;

		chart.update(0, false);
		cfg.timeout = null;

	}, 500);
}

//an array to keep track of which sensors have been given a dataset yet.
//appended to in the order in which we create datasets!
var datasets_existing_for = []; 
// chart is a chart object
// sensor_id is the id of the sensor we want to plot
function getOrCreateDataset(sensor_name, sensor_id, chartid, stream_name) {
	var cfg = pmChartBySid[chartid]
	var chart = cfg.chart;
	if (datasets_existing_for.includes(sensor_id)) {
		return chart.data.datasets[datasets_existing_for.indexOf(sensor_id)];
	}

	console.log("first data from " + sensor_id)
	// not found, create it (didn't return in the check above)
	var dts = {
		data: [],
		label: sensor_id,
		borderColor: cfg.color || "#000000",
		backgroundColor: "transparent",
		bezierCurve : false,
		markerType : "None",
		fill: false,
		lineTension: 0,
		cubicInterpolationMode: "monotone"
	};

	datasets_existing_for.push(sensor_id);
	//	this was only useful for one plot per chart
	//	cfg.dataset = dts;
	//	don't think this is a good idea now since we are plotting on the same chart
	//cfg.buffer = [];
	chart.data.datasets.push(dts);
	return dts;
}
