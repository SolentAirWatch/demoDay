var drawScalingFactor = 40;

var maxDataPointsInCharts = 100;

var pmChartBySid = {};


//this is a list of sensors which are sending data.
//it is populated on the fly, as we receive data from the sensor.
//it is found under message.id
var sensors_active = {}

//this function makes a chart with name "id".


function make_chart(id) {
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
			legend: { display: false }
		}
	});
	chart.name = id;
	chart.buffers = [];
	return chart;
}

//var ctx = undefined;

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
		txt.innerText = "West Quay";
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
			"name": "PM"
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

$.postJSON("https://api.opensensors.io/v1/login",
	{
		"username" : "solentairwatch",
		"password" : prompt("Enter opensensors password:", "")
	},
	function(data, status) {
		token = data.token;	
		console.log(status);
		var api_url = "https://realtime.opensensors.io/v1/events/users/solentairwatch/topics?token=" + token;
		var eventUrl = new EventSource(api_url);
		eventUrl.onmessage = function(event) {
			eventnum += 1;
			//how many of the inital messages do we ignore
			var ignore = 2;
			var message = JSON.parse(JSON.parse(event.data).message);
			var sid = message.id;
			console.log(sid);
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

function processInitialDataChart(sensor_name, chartid, message, sid) {
	var dataXy = [{x: message.time, y: message.PM25}];
//	console.log(dataXy)
	var dataset = getOrCreateDataset(sensor_name, chartid, "PM25");
	dataset.data = dataXy;

	// update all charts
	pmChartBySid[chartid].chart.update(00, false);
}

function processStreamDataChart(sensor_name, message, sid) {
	getOrCreateDataset(sensor_name, 1, "PM25");
	var datapoint = {x: message.time, y: message.PM25};
	addDataPoint(sid, 1, "PM25", datapoint);
}

function addDataPoint(sid, chartid, readingName, point) {
	var cfg = pmChartBySid[chartid];
	cfg.buffer.push(point);
	requestRender(cfg);
}

function requestRender(cfg) {
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
		var dataset = cfg.dataset;

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

// chart is a chart object, sensor_name is "bmp", "pm" or "a4",
// stream_name is for example "PM25_STD"
function getOrCreateDataset(sensor_name, chartid, stream_name) {
	var cfg = pmChartBySid[chartid]
	var chart = cfg.chart;
	if (cfg.dataset !== undefined && cfg.dataset !== null) {
		return cfg.dataset;
	}

	// if not found (didn't return in the check above)
	var dts = {
		data: [],
		label: cfg.displayName || stream_name,
		borderColor: cfg.color || "#000000",
		backgroundColor: "transparent",
		bezierCurve : false,
		markerType : "None",
		fill: false,
		lineTension: 0,
		cubicInterpolationMode: "monotone"
	};

	cfg.dataset = dts;
	cfg.buffer = [];
	chart.data.datasets.push(dts);
	return dts;
}
