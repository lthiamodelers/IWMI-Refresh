var infowindow;
var map;
var agencyNames = [];
var agencyTypes = [];
var datasetNames = [];
var locations = [];
var cluster;
var oldType = "Select Agency Type";
var userLoggedIn;
var users;
//This variable needs to be assigned dynamically.
var parameterTypes = ["Aquatic Plants/Algal Biomass", "Bacteriology/Microbiology", "Fish", "Flow/Stage", "General Chemistry", "Groundwater Level", "Groundwater Quality", "Habitat", "Lake Clarity", "Macroinvertebrates", "Metals", "Nutrients", "Organics/Pesticides", "Radiological", "Hoosier Riverwatch"];
//Google search "Indianapolis, IN lat long". Will be used as the center point.
var center = {
	lat: 39.7684,
	lng: -86.1581
};

parameterTypes.sort();

var userTab = document.getElementById("userTab");
var loginTab = document.getElementById("loginNav");
var managmentTab = document.getElementById("managmentNav");
if (localStorage.getItem("name") !== null && localStorage.getItem("name") !== "") {
	//A user is logged in

	loginTab.style.position = "absolute";
	loginTab.style.visibility = "hidden";
	managmentTab.visibility = "visible";
	userTab.visibility = "visible";
	userTab.textContent = localStorage.getItem("name");
} else {
	managmentTab.visibility = "hidden";
	userTab.visibility = "hidden";
}

function Location(oldLocation, marker) {
	this.oldLocation = oldLocation;
	this.FID = oldLocation.FID;
	this.GID = oldLocation.GID;
	this.type = oldLocation.type;
	this.organization = oldLocation.organization;
	this.name = oldLocation.name;
	this.siteNo = oldLocation.siteNo;
	this.description = oldLocation.description;
	this.parameterType = oldLocation.parameterType;
	this.parameter = oldLocation.parameter;
	this.frequency = oldLocation.frequency;
	this.publiclyAvailible = oldLocation.publiclyAvailible;
	this.startDate = oldLocation.startDate;
	this.endDate = oldLocation.endDate;
	this.contactURL = oldLocation.contactURL;
	this.id = oldLocation.id;
	this.quality = oldLocation.quality;
	this.email = oldLocation.email;
	this.huc8 = oldLocation.huc8;
	this.huc10 = oldLocation.huc10;
	this.huc12 = oldLocation.huc12;
	this.lat = oldLocation.lat;
	this.lng = oldLocation.lng;
	this.marker = marker;
}

function BasicLocation(FID, GID, type, organization, name, siteNo, description, parameterType, parameter, frequency, publiclyAvailible, startDate, endDate, contactURL, id, quality, email, huc8, huc10, huc12, lat, lng) {
	this.FID = FID;
	this.GID = GID;
	this.type = type;
	this.organization = organization;
	this.name = name;
	this.siteNo = siteNo;
	this.description = description;
	this.parameterType = parameterType;
	this.parameter = parameter;
	this.frequency = frequency;
	this.publiclyAvailible = publiclyAvailible;
	this.startDate = startDate;
	this.endDate = endDate;
	this.contactURL = contactURL;
	this.id = id;
	this.quality = quality;
	this.email = email;
	this.huc8 = huc8;
	this.huc10 = huc10;
	this.huc12 = huc12;
	this.lat = lat;
	this.lng = lng;
}

function populateAgencyType() {
	var agencyTypeSelect = document.getElementById("agencyTypeSelect");
	for (var i = 0; i < agencyTypes.length - 1; i++) {
		var type = agencyTypes[i];
		var el = document.createElement("option");
		console.log("Type: " + type);
		el.textContent = type;
		el.value = type;
		agencyTypeSelect.appendChild(el);
	}
}

function parseUsers(data) {
	users = JSON.parse(data);
}

function addAgencyType(loc) {
	//Could we find the agency type in the array?
	var found = false;

	//Loop through each agency type in the agencyNames array.
	for (var i = 0; i < agencyNames.length; i++) {
		//Check if agencyNames has type in it.
		if (agencyNames[i][0] === loc.type) {
			//Is the name of the agency already in the array?
			if (agencyNames[i].indexOf(loc.organization) == -1) {
				//Append the name of the agency to the array, if it isn't in there already.
				agencyNames[i].push(loc.organization);
			}

			//We found the agency type!
			found = true;
			//Get out of this array
			break;
		}
	}

	if (found === false) {
		//Couldn't find the agency type in the array.
		//Make a new array
		var arr = [];
		//Put the type, and then the name of the agency into the array
		arr.push(loc.type);
		arr.push(loc.organization);
		//Push the array, and the type to agencyNames, and agencyTypes, respectively
		agencyNames.push(arr);
		agencyTypes.push(loc.type);
	}
}

function addDatasetName(loc) {
	if (!datasetNames.includes(loc.name)) {
		datasetNames.push(loc.name);
	}
	datasetNames.sort();
}

//THIS NEEDS FIXED
//		function addParameterType(loc) {
//			if (!parameterTypes.includes(loc.parameter)) {
//				parameterTypes.push(loc.parameter);
//			}
//		}

function parse(text) {
	oldLocations = JSON.parse(localStorage.getItem("locations"));
	if (oldLocations === null || oldLocations.length < 100) {
		console.log("We're doing it the old-fashioned way.");

		var data = Papa.parse(text);
		for (var i = 1; i < data.data.length; i++) {
			var a = data.data[i];

			var loc = new BasicLocation(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11],
				a[12], a[13], a[14], a[15], a[16], a[17], a[18], a[19], a[20], a[21]);

			var lat = parseFloat(loc.lat);
			var lng = parseFloat(loc.lng);
			var name = loc.name;

			var marker = new google.maps.Marker({
				position: {
					lat: parseFloat(loc.lat),
					lng: parseFloat(loc.lng)
				},
				title: loc.name
			});

			var newLoc = new Location(loc, marker);

			locations.push(newLoc);
		}
	} else {
		oldLocations.forEach(function (loc) {
			var marker = new google.maps.Marker({
				position: {
					lat: parseFloat(loc.lat),
					lng: parseFloat(loc.lng)
				},
				title: loc.name
			});
			var newLoc = new Location(loc, marker);
			locations.push(newLoc);
		});
	}
	myMap();
}

function myMap() {


	//Create the map with refrence to the #map element.
	var mapCanvas = document.getElementById("map");
	var mapOptions = {
		center: center,
		zoom: 7
	};

	//Base URL for the circle icon used as a marker.
	var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
	map = new google.maps.Map(mapCanvas, mapOptions);

	//Empty array to put the markers in as they are created. This will be used to make a markerClusterer
	var markers = [];

	for (var i = 0; i < locations.length; i++) {
		var loc = locations[i];
		addAgencyType(loc);
		addDatasetName(loc);
		//addParameterType(loc);

		loc.marker.setMap(map);

		markers.push(loc.marker);

		//A closure to make sure that infoWindows are created for their own markers.
		(function (_marker) {


			//Create the info window based on the content variable ^^

			var content = '<h5><a href="' + loc.contactURL + '">' + loc.name + '</a></h5><p><b>Agency:</b> ' +
				loc.organization + '<br><b>Location:</b> ' + loc.description + '<br><b>Site Number:</b> ' +
				loc.siteNo + '<br><b>Parameter(s) sampled:</b> ' + loc.parameter + '<br><b>Parameter Type:</b> ' +
				loc.parameterType + '<br><b>Monitoring Frequency:</b> ' + loc.frequency +
				'<br><b>Publicly Availible?:</b> ' + loc.publiclyAvailible + '<br><b>Data Quality Information:</b> ' +
				loc.quality + '<br><b>Date of record:</b> ' + loc.startDate + ' to ' + loc.endDate +
				'<br><b>HUC12:</b> ' + loc.huc12 + '</p>';

			var infowindow = new google.maps.InfoWindow({
				content: content,
				maxWidth: 400
			});

			//Add the on click listener to the marker.
			_marker.addListener('click', function () {
				//An attempt to close the previously opened window.
				if (infowindow) infowindow.close();
				infowindow.open(map, _marker);
			});

		}(loc.marker));

	}

	agencyTypes.sort();

	// Add a marker clusterer to manage the markers.
	cluster = new MarkerClusterer(map, markers, {
		imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
		maxZoom: 15 //An arbitrary value that seems to work well.
	});

	populateAgencyType();
	populateDatasetName();
	populateParameterTypes();

	var items = JSON.parse(localStorage.getItem("locations"));
	if (items === null || items.length < 100) {
		var oldLocations = [];
		locations.forEach(function (loc) {
			oldLocations.push(loc.oldLocation);
		});
		console.log("Saving!!");
		localStorage.setItem("locations", JSON.stringify(oldLocations));
	}

}

//click function for search
function searchCity() {

	var geocoder = new google.maps.Geocoder();
	var input = document.getElementById("city");
	var cityAndState = input.value + ", IN";

	if (input.value === null || input.value === "") {
		var center = {
			lat: 39.7684,
			lng: -86.1581
		};

		var mapOptions = {
			center: center,
			zoom: 7
		};
		map.setOptions(mapOptions);
	} else {

		geocoder.geocode({
			'address': cityAndState
		}, function (results, status) {

			if (status == google.maps.GeocoderStatus.OK) {

				console.log("location: " + results[0].geometry.location.lat() + " " + results[0].geometry.location.lng());
				map.setCenter(new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng()));
				map.setZoom(13);
			}
		});

		console.log(input.value.length);

	}

}

function populateParameterTypes() {
	var select = document.getElementById("parameterSelect");
	if (select.getElementsByTagName("option").length < 3) {
		parameterTypes.forEach(function (type) {
			console.log("Par. Type: " + type);
			var el = document.createElement("option");
			el.textContent = type;
			el.value = type;
			select.appendChild(el);
		});
	}
}

function filterHUC() {
	var huc = document.getElementById("hucSearch");


	var bounds = new google.maps.LatLngBounds();
	cluster.clearMarkers();
	cluster = null;
	markers = [];


	if (huc.value.length == 7) {
		//Use HUC8
		locations.forEach(function (loc) {
			if (loc.huc8 === huc.value) {
				loc.marker.setVisible(true);
				markers.push(loc.marker);
				bounds.extend(loc.marker.position);
			}
		});
	} else if (huc.value.length == 9) {
		//Use HUC10
		locations.forEach(function (loc) {
			if ((loc.huc10 + "") === (huc.value + "")) {
				loc.marker.setVisible(true);
				markers.push(loc.marker);
				bounds.extend(loc.marker.position);
			}
		});
	} else if (huc.value.length == 11) {
		//Use HUC12
		locations.forEach(function (loc) {
			if (loc.huc12 === huc.value) {
				loc.marker.setVisible(true);
				markers.push(loc.marker);
				bounds.extend(loc.marker.position);
			}
		});
	} else {
		locations.forEach(function (loc) {
			loc.marker.setVisible(true);
			markers.push(loc.marker);
		});
	}

	cluster = new MarkerClusterer(map, markers, {
		imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
		maxZoom: 15 //An arbitrary value that seems to work well.
	});

	if (huc.value.length == 7 || huc.value.length == 9 || huc.value.length == 11) {
		map.fitBounds(bounds);
		if (map.getZoom() > 13) {
			map.setZoom(13);
		}

	} else {
		map.setCenter(center);
		map.setZoom(7);
	}
}

function filterParameterTypes() {
	var select = document.getElementById("parameterSelect");
	var val = select.value;

	if (val !== "Select Parameter Type") {
		var bounds = new google.maps.LatLngBounds();

		cluster.clearMarkers();
		cluster = null;
		markers = [];

		locations.forEach(function (loc) {
			if (val === "Show all") {

				loc.marker.setVisible(true);
				markers.push(loc.marker);

				//Search to see if parameterType contains val in a regex format.
			} else if (loc.parameterType.indexOf(val) !== -1 && loc.parameterType !== undefined) {

				loc.marker.setVisible(true);
				markers.push(loc.marker);
				bounds.extend(loc.marker.position);
			}
		});

		cluster = new MarkerClusterer(map, markers, {
			imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
			maxZoom: 15 //An arbitrary value that seems to work well.
		});

		if (val !== "Show all") {
			map.fitBounds(bounds);
			if (map.getZoom() > 13) {
				map.setZoom(13);
			}
		}
	}
}

function populateDatasetName() {
	var datasetSelect = document.getElementById("datasetSelect");
	datasetNames.forEach(function (name) {
		var el = document.createElement("option");
		el.textContent = name;
		el.value = name;
		datasetSelect.appendChild(el);
	});
}

function filterDatasetNames() {
	var select = document.getElementById("datasetSelect");
	var val = select.value;

	if (val !== "Select Dataset Name") {
		var bounds = new google.maps.LatLngBounds();

		cluster.clearMarkers();
		cluster = null;
		markers = [];

		locations.forEach(function (loc) {

			if (val === "Show all") {

				loc.marker.setVisible(true);
				markers.push(loc.marker);
			} else if (loc.name === val) {

				loc.marker.setVisible(true);
				markers.push(loc.marker);
				bounds.extend(loc.marker.position);
			}
		});

		cluster = new MarkerClusterer(map, markers, {
			imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
			maxZoom: 15 //An arbitrary value that seems to work well.
		});

		if (val !== "Show all") {
			map.fitBounds(bounds);
			if (map.getZoom() > 13) {
				map.setZoom(13);
			}
		}
	}
}

function filterAgencyTypes() {
	var select = document.getElementById("agencyTypeSelect");
	var agencySelect = document.getElementById("agencySelect");
	var val = select.value;

	if (val !== "Select Agency Type") {

		for (var i = 2; i < agencySelect.options.length; i++) {

			agencySelect.options[i] = null;
		}

		console.log("Old Type: " + oldType);
		if (val !== oldType) {

			var bounds = new google.maps.LatLngBounds();

			cluster.clearMarkers();
			cluster = null;
			markers = [];

			locations.forEach(function (loc) {

				if (val === "Show all") {

					loc.marker.setVisible(true);
					markers.push(loc.marker);

				} else if (loc.type === val) {

					loc.marker.setVisible(true);
					markers.push(loc.marker);
					bounds.extend(loc.marker.position);
				}
			});

			cluster = new MarkerClusterer(map, markers, {
				imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
				maxZoom: 15 //An arbitrary value that seems to work well.
			});

			if (val !== "Show all") {
				map.fitBounds(bounds);
				if (map.getZoom() > 13) {
					map.setZoom(13);
				}
			}


		}
		if (val !== "Show all") {
			populateAgencies(val);
		} else {
			map.setCenter(center);
			map.setZoom(7);
		}
	} else {
		agencySelect.disabled = true;
	}

	if (val === "Show all") {
		agencySelect.disabled = true;
	}
	oldType = val;
}

function filterAgencies() {

	var typeSelect = document.getElementById("agencyTypeSelect");
	var select = document.getElementById("agencySelect");
	var val = select.value;
	var bounds = new google.maps.LatLngBounds();

	if (val !== "Select Agency") {

		cluster.clearMarkers();
		cluster = null;
		markers = [];

		locations.forEach(function (loc) {

			if (loc.type === typeSelect.value && loc.organization === val) {

				loc.marker.setVisible(true);
				markers.push(loc.marker);
			} else if (val === "Show all") {
				if (loc.type === typeSelect.value) {
					loc.marker.setVisible(true);
					markers.push(loc.marker);
				}
			}
		});

		markers.forEach(function (mark) {
			bounds.extend(mark.position);
		});

		cluster = new MarkerClusterer(map, markers, {
			imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
			maxZoom: 15 //An arbitrary value that seems to work well.
		});

		map.fitBounds(bounds);
		if (map.getZoom() > 13) {
			map.setZoom(13);
		}
	}
}

function populateAgencies(type) {
	var agencySelect = document.getElementById("agencySelect");

	for (var i = 2; i < agencySelect.options.length; i++) {

		console.log("Deleting '" + agencySelect.options[i].value + "'.");

		agencySelect.options[i] = null;
	}

	agencyNames.forEach(function (name) {
		if (type === "Show all") {
			for (i = 1; i < name.length; i++) {
				var el = document.createElement("option");
				el.textContent = name[i];
				el.value = name[i];
				agencySelect.appendChild(el);
			}
		} else if (name[0] === type) {
			for (i = 1; i < name.length; i++) {
				var el = document.createElement("option");
				el.textContent = name[i];
				el.value = name[i];
				agencySelect.appendChild(el);
			}
		}
	});
	agencySelect.disabled = false;
}

document.getElementById("city").addEventListener("keyup", searchCity);
document.getElementById("agencyTypeSelect").addEventListener("click", filterAgencyTypes);
document.getElementById("agencySelect").addEventListener("click", filterAgencies);
document.getElementById("datasetSelect").addEventListener("click", filterDatasetNames);
document.getElementById("parameterSelect").addEventListener("click", filterParameterTypes);
document.getElementById("hucSearch").addEventListener("keyup", filterHUC);

//Load in the csv, and call myMap with it.
$(document).ready(function () {
	$.ajax({
		type: "GET",
		url: "res/inwater.csv",
		dataType: "text",
		success: function (data) {
			parse(data);
		}
	});
});