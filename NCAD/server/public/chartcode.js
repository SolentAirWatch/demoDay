var maxDataPointsInCharts = 1000;
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
						autoSkip: true,
						maxRotation: 50,
						minRotation: 50
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
			//height: 10,
			maintainAspectRatio: false,
			animation: false,
			responsive: false,
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
//window.addEventListener("load", function() {
// make pm charts by sid
var chartsContainer = document.getElementById("chart_container");

//each chart gets a div with text etc
//for loop here is replaced so only get one copy

for (var i=1;i<=1;i++) {
	var el = document.createElement("div");
	el.className="chart";

	// canvas
	var canvas = document.createElement("canvas");
	el.appendChild(canvas);
	canvas.className="chart_canvas";
	canvas.id = "chart_canvas";
	canvas.height = 300;
	canvas.width = 1200;
	chartsContainer.appendChild(el);

	// sensor ID text
	var txt = document.createElement("div");
	txt.id = "chart_text";
	txt.innerText = "Live sensor data: PM 2.5";
	el.appendChild(txt);
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
//});

//set up the event listener
//so that we know when we first receive data
var token ="";
var password = "";
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
while (!["H","L","h","l","d"].includes(plot_mode)) {
	plot_mode = prompt("Plot (H)istorical or (L)ive data? Or 'd' for display.", "d");
}

var APIkey = "c26fa96c-16b8-4fe9-967d-bf0e14047f38";

var OpenSensorsUrl = "https://api.opensensors.io";
var apiBaseUrl = "/v1/messages/topic//orgs/solentairwatch/sniffy?";
//an array of all datapoints.
var all_data = [];
//decide which plotting mode
//and then process data
if(plot_mode == "H" || plot_mode == "h") {
	//plotting historical data
	var startDate = "2017-06-13T20:00:00Z";
	var endDate = "2017-06-13T23:20:00Z";
	//third value:
	//true: include spoof data
	//false: don't include spoof data
	getHistoricalData(startDate, endDate, true, updateChartDatasetsThenPlot);
	//getHistoricalData(startDate, endDate, false, onDataFinish);
	/*
	$.APIgetJSON(apiHistoryUrl, APIkey, function(data) {
		var messageLength = data.messages.length;	
		var message = {};
		console.log(data);
		var sid = 0;
		console.log("got " + messageLength + " messages in total");
	});
	*/
} else if(plot_mode == "L" || plot_mode == "l") {
	/*
	var realtimeAPIUrl = "https://realtime.opensensors.io/v1/events/topics//orgs/solentairwatch/sniffy";
	console.log("making API request");
	$.APIgetJSON(realtimeAPIUrl, APIkey, function(data, status) {
		console.log("data received");
		console.log("status: " + status);
		console.log(data);
	});
	*/
	//probably a bad idea...
	var password = prompt("Enter opensensors password:", "");
	//get the token, and on response set up event listener
	setupLiveTokenListener();
}

function getHistoricalData(startDate, endDate, getSpoof, callback) {
	//if getSpoof is false we ignore sids which are negative
	//opensensors won't send all data at once, it will give url to next one.
	var apiHistoryUrl = OpenSensorsUrl + apiBaseUrl + "start-date=" + startDate + "&end-date=" + endDate;
	getJSONdata(apiHistoryUrl, getSpoof, callback);
}

function getJSONdata(url, getSpoof, callback) {
	//console.log("JSON call here with callback :" + callback);
	//recursive call to get all data
	$.APIgetJSON(url, APIkey, function(data) {
		var messageLength = data.messages.length;	
		var message = {};
		var sid = 0;
		console.log("got " + messageLength + " message(s) in total");
		var c = 0;
		for (c = 0; c < messageLength; c++){
			message = JSON.parse(data.messages[c].payload.text);
			//sid = message.id;
			//console.log(message);
			//console.log("reading history item with sid = " + sid);
			if ( sid >= 0 || getSpoof == true ) {
				all_data.push(message);
			}
		}
		//console.log("next here is :" + data.next);
		if (data.next === undefined ){
			callback();
			return;
		} else {
			console.log("getting more data!");
			var newUrl = OpenSensorsUrl + data.next;
			//console.log("new url is :" + newUrl);
			getJSONdata(newUrl, getSpoof, callback);
		}
	});
}
/*
function onDataFinish() {
	//this gets called when all of the historical data is loaded
	//let's plot it!
	var c = 0;
	var messageLength = all_data.length;
	for (c = 0; c < messageLength; c++){
		sid = all_data[c].id;
		if ( c == 0) {
			processInitialDataChart("pm", 1, all_data[c], sid);
		} else {
			processStreamDataChart("pm", all_data[c], sid);
		}
	}
}
*/

	function setupLiveTokenListener() {
		$.postJSON("https://api.opensensors.io/v1/login",
			{
				"username" : "solentairwatch",
				"password" : password
			},
			function(data, status) {
				console.log("new token received");
				token = data.token;	

				var apiRealtimeUrl = "https://realtime.opensensors.io/v1/events/users/solentairwatch/topics?token=" + token;
				var eventUrl = new EventSource(apiRealtimeUrl);
				//get a new token after a while
				setTimeout(function(){
					eventUrl.close();
					console.log("getting new token");
					setupLiveTokenListener();
				}, 30*60*1000);
				//the event listener
				eventUrl.onmessage = function(event) {
					eventnum += 1;
					//how many of the inital messages do we ignore
					var ignore = 2;
					var message = JSON.parse(JSON.parse(event.data).message);
					//	console.log(message);
					var sid = message.id;
					//console.log("message from id " + sid);
					if ( eventnum < ignore + 1 ) {
						//opensensors sends strange initial data, dump it
					} else if ( eventnum == ignore + 1){
						//log the first one we're plotting
						//console.log(message);
						all_data.push(message);
						updateChartDatasetsThenPlot();
						//		processInitialDataChart("pm", 1, message, sid);
					} else {
						//update data
						all_data.push(message);
						updateChartDatasetsThenPlot();
						//		processStreamDataChart("pm", message, sid);
					}
				}
			}
		);

	}

function processInitialDataChart(sensor_name, chartid, message, sid) {
	var dataXy = [{x: message.time, y: message.PM25}];
	//console.log(dataXy)
	var dataset = getOrCreateDataset(sensor_name, sid, chartid, "PM25");
	dataset.data = dataXy;

	// update all charts
	pmChartBySid[chartid].chart.update(00, false);
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

function updateChartDatasetsThenPlot() {
	//this code updates the chart datasets using all_data and resamples.
	//then it plots

	var cfg = pmChartBySid[1];

	if (cfg.timeout !== null) {
		//console.log("updating already!");
		// do nothing, there's a timeout already
		return;
	}

	// there is no timeout, so set one
	cfg.timeout = setTimeout(function(){
		var sensors_plotted = [];
		var chart = cfg.chart;
		var datasets = chart.data.datasets;
		console.log("now parsing " + all_data.length + " points");

		for(var i in all_data) {
			var message = all_data[i];
			var datapoint = {x: message.time, y: message.PM25};
			//var sid = message.id;

			//for clean air day we are only plotting ids 1 and 3
			//id 1: road
			//id 3: pedes
			/*
			if (![1,3].includes(sid)){
				continue;
			}
			*/
			sid = Math.floor(Math.random()*2);

			if (sensors_plotted.includes(sid)) {
				//we've plotted from this sensor before
				datasets[datasets_existing_for.indexOf(sid)].data.push(datapoint);
			} else {
				//new sensor id.
				sensors_plotted.push(sid);
				//console.log(dataXy)
				var dataset = getOrCreateDataset("pm", sid, 1, "PM25");
				dataset.data = [datapoint];
			}
		}

		//now resample each one
		for (var j in datasets){
			datasets[j].data = dataResample(datasets[j].data);
		}

		//console.log("rendering");
		chart.update(0, false);
		cfg.timeout = null;

	}, 500);




}

function IDrequestRender(cfg) {
	// update all charts
	if (cfg.timeout !== null) {
		//console.log("updating already!");
		// do nothing, there's a timeout already
		return
	}

	// there is no timeout, so set one
	cfg.timeout = setTimeout(function(){
		//console.log("rendering");

		var chart = cfg.chart;

		var IDbuffer = cfg.IDbuffer;

		//var dataset = chart.data.datasets[datasets_existing_for.indexOf(sid)];

		var datasets = chart.data.datasets;
		/*
		 * the below uses the IDbuffer

		//var data = dataset.data.slice();
		for (var j in IDbuffer) {
			datasets[datasets_existing_for.indexOf(IDbuffer[j].id)].data.push(IDbuffer[j].datapoint);
		//data.push(buffer[j]);
		}

		IDbuffer.length = 0;
		*/
		//try instead to replot from the all_data array instead.

		//now resample each one
		for (var j in datasets){
			datasets[j].data = dataResample(datasets[j].data);
		}

		/* this needs adapting somehow...
		dataset.data = data;
		*/

		chart.update(0, false);
		cfg.timeout = null;

	}, 500);
}


function dataResample(data_array) {
	//this takes an array and interpolates if it has more that maxDataPointsInCharts elements
	//	console.log("Resampling!");
	//the number of points
	var N = data_array.length;
	console.log("I was passed " + N + " points to resample");
	if (N <= maxDataPointsInCharts) {
		//nothing to do here
		console.log("But that is fine.");
		return data_array;
	} else {
		//work out how bad the situation is
		//not particularly smooth behaviour but hey-ho.
		var skip = Math.ceil(N / maxDataPointsInCharts);

		var newArray = data_array.filter(function (element, index) {
			return ( index % skip == 0);
		});
		console.log("I'm returning " + newArray.length + " points in total.");
		return newArray;
	}
}

//colour according to sensor id.
var NCAD_color = {
	1 : "#ff7d09",
	3 : "#f8f8b0"
}

//an array to keep track of which sensors have been given a dataset yet.
//appended to in the order in which we create datasets!
var datasets_existing_for = []; 
// chart is a chart object
// sensor_id is the id of the sensor we want to plot
function getOrCreateDataset(sensor_name, sensor_id, chartid, stream_name) {
	var cfg = pmChartBySid[chartid];
	//console.log(cfg);


	var chart = cfg.chart;
	if (datasets_existing_for.includes(sensor_id)) {
		return chart.data.datasets[datasets_existing_for.indexOf(sensor_id)];
	}

	console.log("first data from " + sensor_id)
	// not found, create it (didn't return in the check above)
	var dts = {
		data: [],
		label: sensor_id,
		borderColor: NCAD_color[sensor_id],
		backgroundColor: "transparent",
		bezierCurve : true,
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
