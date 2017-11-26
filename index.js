var map;
var locations = [];
var markers = [];
var agencySearch = "%";
var agencyNameSearch = "%";
var datasetNameSearch = "%";
var parameterTypeSearch = "%";
var nutrientSearch = "%";
var resetFlag = false;
var lastHUClength = 0;
//Google search "Indianapolis, IN lat long". Will be used as the center point.
var center = {
    lat: 39.7684,
    lng: -86.1581
};

/*
Agency Type = type
Agency Name = organization
Dataset Name = name
Parameter Type = parameterType
 */

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
    this.huc12 = huc12 + '';
    this.lat = lat;
    this.lng = lng;
}

//These variables should be string arrays
function searchDistinct(locationList) {
    var tempAgencyTypes = [], tempAgencyNames = [], tempDatasetNames = [], tempParameterTypes = [], tempNutrients = [];
    var agencyTypes = [], agencyNames = [], datasetNames = [], parameterTypes = [], nutrients = [];
    var agencyTypeSelect = document.getElementById("agencyTypeSelect");
    var agencySelect = document.getElementById("agencySelect");
    var datasetSelect = document.getElementById("datasetSelect");
    var parameterSelect = document.getElementById("parameterSelect");
    var nutrientSelect = document.getElementById("nutrientSelect");


    tempAgencyTypes = alasql('SELECT DISTINCT type FROM ?', [locationList]);
    for (var i = 0; i < tempAgencyTypes.length; i++) {
        if (tempAgencyTypes[i].type !== "") {
            agencyTypes.push(tempAgencyTypes[i].type);
        }
    }
    agencyTypes.sort();

    tempAgencyNames = alasql('SELECT DISTINCT organization FROM ?', [locationList]);
    for (var i = 0; i < tempAgencyNames.length; i++) {
        if (tempAgencyNames[i].organization !== "") {
            agencyNames.push(tempAgencyNames[i].organization);
        }
    }
    agencyNames.sort();

    tempDatasetNames = alasql('SELECT DISTINCT name FROM ?', [locationList]);
    for (var i = 0; i < tempDatasetNames.length; i++) {
        if (tempDatasetNames[i].name !== "") {
            datasetNames.push(tempDatasetNames[i].name);
        }
    }
    datasetNames.sort();

    tempParameterTypes = alasql('SELECT DISTINCT parameterType FROM ?', [locationList]);
    for (var i = 0; i < tempParameterTypes.length; i++) {
        if (tempParameterTypes[i].parameterType !== "") {
            parameterTypes.push(tempParameterTypes[i].parameterType);
        }
    }
    var allParameters = [];
    parameterTypes.forEach(function (type) {
        var pars = type.split(", ");
        pars.forEach(function (par) {
            allParameters.push(par);
        });
    });
    parameterTypes = uniq(allParameters);
    parameterTypes.sort();

	//Check for Nitrogen
	tempNutrients = alasql("SELECT FID FROM ? WHERE " +
	"parameter LIKE '%nh4%' OR " +
	"parameter LIKE '%no3%' OR " +
	"parameter LIKE '%nitrogen%' OR " +
	"parameter LIKE '%nitrate%' OR " +
	"parameter LIKE '%nitrite%' OR " +
	"parameter LIKE '%ammonia%' OR " +
	"parameter LIKE '%parameters%'", [locationList]);
	if (tempNutrients.length > 0) nutrients.push("Nitrogen, many forms");

	//Check for Phosphorous
	tempNutrients = alasql("SELECT FID FROM ? WHERE " +
	"parameter LIKE '%po4%' OR " +
	"parameter LIKE '%srp%' OR " +
	"parameter LIKE '%phos%' OR " +
	"parameter LIKE '%parameters%'", [locationList]);
	if (tempNutrients.length > 0) nutrients.push("Phosphorous, many forms");

    populate(agencyTypeSelect, "Select Agency Type", agencyTypes);
    populate(agencySelect, "Select Agency", agencyNames);
    populate(datasetSelect, "Select Dataset Name", datasetNames);
    populate(parameterSelect, "Select Parameter Type", parameterTypes);
    populate(nutrientSelect, "Select Nutrient", nutrients);
    resetFlag = false;
}


function setOption(selectElement, value) {
    var options = selectElement.options;
    for (var i = 0, optionsLength = options.length; i < optionsLength; i++) {
        if (options[i].value === value) {
            selectElement.selectedIndex = i;
            return true;
        }
    }
    return false;
}

function populate(select, firstDefault, list) {
    var prevVal = select.value;
    if (resetFlag) prevVal = "";
    for (var i = 0; i < select.options.length; i++) {
        select.options[i] = null;
    }
    select.options.length = 0;

    if (list.length === 1) {
        select.disabled = true;
        var el = document.createElement("option");
        el.textContent = list[0];
        el.value = list[0];
        select.appendChild(el);
        setOption(select, list[0]);
    } else if (list.length === 0) {
		select.disabled = true;
		var el = document.createElement("option");
		el.textContent = "No matches";
		el.value = "No matches";
		select.appendChild(el);
		setOption(select, "No matches");
	} else {
        select.disabled = false;
        //Add firstDefault to the top
        var el = document.createElement("option");
        el.textContent = firstDefault;
        el.value = firstDefault;
        select.appendChild(el);

        //Add Show all
        var el = document.createElement("option");
        el.textContent = "Show all";
        el.value = "Show all";
        select.appendChild(el);

        //Stick the types in all into the select as options
        for (var i = 0; i < list.length; i++) {
            var el = document.createElement("option");
            el.textContent = list[i];
            el.value = list[i];
            select.appendChild(el);
        }
        setOption(select, prevVal);
    }
}

function search() {
	var hucLayer = new google.maps.KmlLayer({
		url: 'https://raw.githubusercontent.com/lthiamodelers/IWMI-Refresh/redo/res/HUC08.kml',
		map: map
	});
    //Create variables for the search types.
    var agencyTypeSelect = document.getElementById("agencyTypeSelect");
    var agencySelect = document.getElementById("agencySelect");
    var datasetSelect = document.getElementById("datasetSelect");
    var parameterSelect = document.getElementById("parameterSelect");
    var nutrientSelect = document.getElementById("nutrientSelect");

    var agencyType = agencyTypeSelect.value;
    var agency = agencySelect.value;
    var dataset = datasetSelect.value;
    var parameter = parameterSelect.value;
    var nutrient = nutrientSelect.value;

    if (!resetFlag) {
        if (agencyType === "Select Agency Type" || agencyType === "Show all") agencySearch = "%";
        else agencySearch = agencyType;

        if (agency === "Select Agency" || agency === "Show all") agencyNameSearch = "%";
        else agencyNameSearch = agency;

        if (dataset === "Select Dataset Name" || dataset === "Show all") datasetNameSearch = "%";
        else datasetNameSearch = dataset;

        if (parameter === "Select Parameter Type" || parameter === "Show all") parameterTypeSearch = "%";
        else parameterTypeSearch = parameter;

        if (nutrient === "Select Nutrient" || nutrient === "Show all") nutrientSearch = "%";
        else nutrientSearch = nutrient;
    }

    var query = 'SELECT * FROM ? ' +
        'WHERE type LIKE \'' + agencySearch + '\' ' +
        'AND organization LIKE \'' + agencyNameSearch + '\' ' +
        'AND name LIKE \'' + datasetNameSearch + '\' ' +
        'AND parameterType LIKE \'%' + parameterTypeSearch + '%\'';
    var locationList = alasql(query, [locations]);

	if (nutrientSearch === "Nitrogen, many forms") {
	//Check for Nitrogen
	tempNutrients = alasql("SELECT * FROM ? WHERE " +
	"parameter LIKE '%nh4%' OR " +
	"parameter LIKE '%no3%' OR " +
	"parameter LIKE '%nitrogen%' OR " +
	"parameter LIKE '%nitrate%' OR " +
	"parameter LIKE '%nitrite%' OR " +
	"parameter LIKE '%ammonia%' OR " +
	"parameter LIKE '%parameters%'", [locationList]);
	}
	
	if (nutrientSearch === "Phosphorous, many forms") {
	//Check for Phosphorous
	tempNutrients = alasql("SELECT FID FROM ? WHERE " +
	"parameter LIKE '%po4%' OR " +
	"parameter LIKE '%srp%' OR " +
	"parameter LIKE '%phosphorous%' OR " +
	"parameter LIKE '%parameters%'", [locationList]);
	}

    displayMarkers(locationList);
    searchDistinct(locationList);
}

function createMarker(loc) {
    var lat = parseFloat(loc.lat);
    var lng = parseFloat(loc.lng);

    var marker = new google.maps.Marker({
        position: {
            lat: lat,
            lng: lng
        },
        title: loc.name
    });

    marker.setMap(map);

    var content = '<h5><a href="' + loc.contactURL + '" target="_blank">' + loc.name + '</a></h5><p><b>Agency:</b> ' +
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
    marker.addListener('click', function () {
        //An attempt to close the previously opened window.
        if (infowindow) infowindow.close();
        infowindow.open(map, marker);
    });
    return marker;
}

function displayMarkers(locationList) {
    var clusterSwitch = document.getElementById("clusterSwitch");
    var bounds = new google.maps.LatLngBounds();
    var FIDList = [];
    var indexList = [];
	var clusterMarkers = [];
    locationList.forEach(function (loc) {
        FIDList.push(parseInt(loc.FID));
    });
    FIDList.forEach(function (fid) {
        indexList.push(markerSearch(fid));
    });

    for (var i = 0; i < markers.length; i++) {
        var index;
        if (indexList.indexOf(i) !== -1) {
            markers[i][1].setVisible(true);
            bounds.extend(markers[i][1].position);
			clusterMarkers.push(markers[i][1]);
        } else {
            markers[i][1].setVisible(false);
        }
    }
	console.log("Cluster Switch: " + clusterSwitch.checked);

	if (clusterSwitch.checked === true) {
		console.log("Hey hey");
		var markerCluster = new MarkerClusterer(map, markers,
	        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
	}

    if (locationList.length < 1000 && locationList.length !== 0) {
        map.fitBounds(bounds);
        if (map.getZoom() > 13) {
            map.setZoom(13);
        }
    } else {
        map.setCenter(center);
        map.setZoom(7);
    }
    if (document.getElementById("city").value !== "") {
        searchCity();
    }
}

function markerSearch(fid) {
    for (var i = 0; i < markers.length; i++) {
        if (markers[i][0] === fid) return i;
    }
    return -1;
}

function parse(text) {
    var jsonVersion = JSON.parse(text);
    var data = jsonVersion.rows;
    for (var i = 0; i < data.length; i++) {
        var a = data[i];

        var loc = new BasicLocation(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11],
            a[12], a[13], a[14], a[15], a[16], a[17], a[18], a[19], a[20], a[21]);

        locations.push(loc);
    }
    searchDistinct(locations);
    myMap();
}

//Create the maps and stuff
function myMap() {
    //Create the map with reference to the #map element.
    var mapCanvas = document.getElementById("map");
    var mapOptions = {
        center: center,
        zoom: 7
    };


    //Base URL for the circle icon used as a marker.
    var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
    map = new google.maps.Map(mapCanvas, mapOptions);

    for (var i = 0; i < locations.length; i++) {
        markers.push([parseInt(locations[i].FID), createMarker(locations[i])]);
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

                map.setCenter(new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng()));
                map.setZoom(13);
            }
        });


    }

}

Array.prototype.unique = function () {
    var a = this.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

function filterHUC() {
    var huc = document.getElementById("hucSearch");
	var locationList = locations;

	locationList = alasql("SELECT * FROM ? WHERE huc12 LIKE '" + huc.value + "%'", [locations]);

    displayMarkers(locationList);
}

function reset() {
    resetFlag = true;
    agencySearch = "%";
    agencyNameSearch = "%";
    datasetNameSearch = "%";
    parameterTypeSearch = "%";
    nutrientSearch = "%";
    document.getElementById("city").value = "";
    document.getElementById("hucSearch").value = "";
    search();
}

//Helper functions

function uniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item !== ary[pos - 1];
    })
}

function hasClass(el, className) {
    if (el.classList)
        return el.classList.contains(className)
    else
        return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
}

function removeClass(el, className) {
    if (el.classList)
        el.classList.remove(className)
    else if (hasClass(el, className)) {
        var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
        el.className = el.className.replace(reg, ' ')
    }
}

document.getElementById("city").addEventListener("keyup", searchCity);
document.getElementById("reset").addEventListener("click", reset);
document.getElementById("agencyTypeSelect").addEventListener("change", search);
document.getElementById("agencySelect").addEventListener("change", search);
document.getElementById("datasetSelect").addEventListener("change", search);
document.getElementById("parameterSelect").addEventListener("change", search);
document.getElementById("nutrientSelect").addEventListener("change", search);
document.getElementById("clusterSwitch").addEventListener("change", search);
document.getElementById("hucSearch").addEventListener("keyup", filterHUC);

//Load in the csv, and call myMap with it.
$(document).ready(function () {
    $.ajax({
        type: "POST",
        url: "https://www.googleapis.com/fusiontables/v2/query?sql=SELECT%20*%20FROM%201urVQf1MWtRf2XavqoR9a6l_CsdE7IVdpNVNTbNrp&pli&key=AIzaSyASiSo-iDClClxEHgAGFYGvz55dAXIYJWw",
        dataType: "text",
        success: function (data) {
            parse(data);
        }
    });
});
